require('dotenv').config();
const express = require('express');
const emiratesPostService = require('./services/emiratesPostService');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS للسماح لـ Shopify بالاتصال
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({
    status: '✅ التطبيق يعمل بنجاح',
    message: 'تطبيق حساب الشحن عبر API البريد الإماراتي لـ Shopify',
    version: '2.0.0',
    apiProvider: 'Emirates Post API',
    endpoints: {
      main: 'POST /shipping-rates',
      test: 'GET /test-rate',
      countries: 'GET /countries',
      emirates: 'GET /emirates',
      health: 'GET /health'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Endpoint الرئيسي لـ Shopify
app.post('/shipping-rates', async (req, res) => {
  try {
    console.log('📦 ===== Shopify Request Received =====');
    console.log('Full Request Body:', JSON.stringify(req.body, null, 2));

    const { rate } = req.body;

    // التحقق من البيانات المطلوبة
    if (!rate || !rate.destination) {
      console.error('❌ Invalid request structure');
      return res.status(200).json({ rates: [] });
    }

    const destination = rate.destination;
    const items = rate.items || [];
    
    // حساب الوزن الإجمالي والأبعاد
    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    items.forEach(item => {
      // الوزن بالجرام
      totalWeight += (item.grams || 0) * (item.quantity || 1);
      
      // الأبعاد (إذا كانت متوفرة)
      if (item.properties) {
        maxLength = Math.max(maxLength, parseFloat(item.properties.length || 0));
        maxWidth = Math.max(maxWidth, parseFloat(item.properties.width || 0));
        maxHeight = Math.max(maxHeight, parseFloat(item.properties.height || 0));
      }
    });

    // قيم افتراضية إذا لم تكن الأبعاد متوفرة
    if (totalWeight === 0) totalWeight = 500;
    if (maxLength === 0) maxLength = 20;
    if (maxWidth === 0) maxWidth = 15;
    if (maxHeight === 0) maxHeight = 10;

    console.log(`📊 Calculated - Weight: ${totalWeight}g, Dimensions: ${maxLength}x${maxWidth}x${maxHeight}cm`);

    const countryCode = destination.country ? destination.country.toUpperCase() : '';
    const isUAE = countryCode === 'AE';

    console.log(`🌍 Destination: ${countryCode} - ${isUAE ? 'Domestic' : 'International'}`);

    let shippingRate;

    if (isUAE) {
      // شحن محلي داخل الإمارات
      const cityId = emiratesPostService.getCityIdFromName(destination.city);
      shippingRate = await emiratesPostService.calculateDomesticRate({
        originCity: process.env.DEFAULT_ORIGIN_CITY || '3',
        destinationCity: cityId,
        weight: totalWeight,
        length: maxLength,
        width: maxWidth,
        height: maxHeight
      });
    } else {
      // شحن دولي
      shippingRate = await emiratesPostService.calculateInternationalRate({
        destinationCountry: countryCode,
        destinationCity: destination.city || '',
        weight: totalWeight,
        length: maxLength,
        width: maxWidth,
        height: maxHeight
      });
    }

    if (!shippingRate) {
      console.log('⚠️ No shipping rate available');
      return res.status(200).json({ rates: [] });
    }

    // تحويل السعر إلى فلس (cents)
    const priceInCents = Math.round(shippingRate.price * 100);

    const response = {
      rates: [
        {
          service_name: shippingRate.serviceName,
          service_code: shippingRate.serviceCode,
          total_price: priceInCents.toString(),
          currency: 'AED',
          description: shippingRate.description || ''
        }
      ]
    };

    console.log('✅ Response sent:', JSON.stringify(response, null, 2));
    console.log('========================================');

    return res.status(200)
      .set('Content-Type', 'application/json')
      .json(response);

  } catch (error) {
    console.error('❌ Error in /shipping-rates:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(200).json({ rates: [] });
  }
});

// Endpoint لاختبار حساب السعر
app.get('/test-rate', async (req, res) => {
  try {
    const testData = {
      destinationCountry: 'JO',
      destinationCity: 'Amman',
      weight: 1000,
      length: 20,
      width: 15,
      height: 10
    };

    const rate = await emiratesPostService.calculateInternationalRate(testData);
    
    res.json({
      success: true,
      testData,
      result: rate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// عرض الدول المتاحة
app.get('/countries', async (req, res) => {
  try {
    const countries = await emiratesPostService.getCountries();
    res.json({
      success: true,
      count: countries.length,
      countries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// عرض الإمارات المتاحة
app.get('/emirates', async (req, res) => {
  try {
    const emirates = await emiratesPostService.getEmirates();
    res.json({
      success: true,
      count: emirates.length,
      emirates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// معالجة الأخطاء العامة
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ rates: [] });
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 API Provider: Emirates Post`);
  console.log(`📍 Endpoints:`);
  console.log(`   - GET  /`);
  console.log(`   - POST /shipping-rates (Shopify webhook)`);
  console.log(`   - GET  /test-rate`);
  console.log(`   - GET  /countries`);
  console.log(`   - GET  /emirates`);
  console.log(`   - GET  /health`);
  console.log(`✅ Ready to receive requests from Shopify!`);
});