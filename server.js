// require('dotenv').config();
// const express = require('express');
// const emiratesPostService = require('./services/emiratesPostService');
// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(express.json());

// // CORS للسماح لـ Shopify بالاتصال
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200);
//   }
//   next();
// });

// // الصفحة الرئيسية
// app.get('/', (req, res) => {
//   res.json({
//     status: '✅ التطبيق يعمل بنجاح',
//     message: 'تطبيق حساب الشحن عبر API البريد الإماراتي لـ Shopify',
//     version: '2.0.0',
//     apiProvider: 'Emirates Post API',
//     endpoints: {
//       main: 'POST /shipping-rates',
//       test: 'GET /test-rate',
//       countries: 'GET /countries',
//       emirates: 'GET /emirates',
//       health: 'GET /health'
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// // Health check
// app.get('/health', (req, res) => {
//   res.json({
//     status: 'healthy',
//     uptime: process.uptime(),
//     timestamp: new Date().toISOString()
//   });
// });

// // Endpoint الرئيسي لـ Shopify
// app.post('/shipping-rates', async (req, res) => {
//   try {
//     console.log('📦 ===== Shopify Request Received =====');
//     console.log('Full Request Body:', JSON.stringify(req.body, null, 2));

//     const { rate } = req.body;

//     // التحقق من البيانات المطلوبة
//     if (!rate || !rate.destination) {
//       console.error('❌ Invalid request structure');
//       return res.status(200).json({ rates: [] });
//     }

//     const destination = rate.destination;
//     const items = rate.items || [];
    
//     // حساب الوزن الإجمالي والأبعاد
//     let totalWeight = 0;
//     let maxLength = 0;
//     let maxWidth = 0;
//     let maxHeight = 0;

//     items.forEach(item => {
//       // الوزن بالجرام
//       totalWeight += (item.grams || 0) * (item.quantity || 1);
      
//       // الأبعاد (إذا كانت متوفرة)
//       if (item.properties) {
//         maxLength = Math.max(maxLength, parseFloat(item.properties.length || 0));
//         maxWidth = Math.max(maxWidth, parseFloat(item.properties.width || 0));
//         maxHeight = Math.max(maxHeight, parseFloat(item.properties.height || 0));
//       }
//     });

//     // قيم افتراضية إذا لم تكن الأبعاد متوفرة
//     if (totalWeight === 0) totalWeight = 500;
//     if (maxLength === 0) maxLength = 20;
//     if (maxWidth === 0) maxWidth = 15;
//     if (maxHeight === 0) maxHeight = 10;

//     console.log(`📊 Calculated - Weight: ${totalWeight}g, Dimensions: ${maxLength}x${maxWidth}x${maxHeight}cm`);

//     const countryCode = destination.country ? destination.country.toUpperCase() : '';
//     const isUAE = countryCode === 'AE';

//     console.log(`🌍 Destination: ${countryCode} - ${isUAE ? 'Domestic' : 'International'}`);

//     let shippingRate;

//     if (isUAE) {
//       // شحن محلي داخل الإمارات
//       const cityId = emiratesPostService.getCityIdFromName(destination.city);
//       shippingRate = await emiratesPostService.calculateDomesticRate({
//         originCity: process.env.DEFAULT_ORIGIN_CITY || '3',
//         destinationCity: cityId,
//         weight: totalWeight,
//         length: maxLength,
//         width: maxWidth,
//         height: maxHeight
//       });
//     } else {
//       // شحن دولي
//       shippingRate = await emiratesPostService.calculateInternationalRate({
//         destinationCountry: countryCode,
//         destinationCity: destination.city || '',
//         weight: totalWeight,
//         length: maxLength,
//         width: maxWidth,
//         height: maxHeight
//       });
//     }

//     if (!shippingRate) {
//       console.log('⚠️ No shipping rate available');
//       return res.status(200).json({ rates: [] });
//     }

//     // تحويل السعر إلى فلس (cents)
//     const priceInCents = Math.round(shippingRate.price * 100);

//     const response = {
//       rates: [
//         {
//           service_name: shippingRate.serviceName,
//           service_code: shippingRate.serviceCode,
//           total_price: priceInCents.toString(),
//           currency: 'AED',
//           description: shippingRate.description || ''
//         }
//       ]
//     };

//     console.log('✅ Response sent:', JSON.stringify(response, null, 2));
//     console.log('========================================');

//     return res.status(200)
//       .set('Content-Type', 'application/json')
//       .json(response);

//   } catch (error) {
//     console.error('❌ Error in /shipping-rates:', error.message);
//     console.error('Error stack:', error.stack);
//     return res.status(200).json({ rates: [] });
//   }
// });

// // Endpoint لاختبار حساب السعر
// app.get('/test-rate', async (req, res) => {
//   try {
//     const testData = {
//       destinationCountry: 'JO',
//       destinationCity: 'Amman',
//       weight: 1000,
//       length: 20,
//       width: 15,
//       height: 10
//     };

//     const rate = await emiratesPostService.calculateInternationalRate(testData);
    
//     res.json({
//       success: true,
//       testData,
//       result: rate
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // عرض الدول المتاحة
// app.get('/countries', async (req, res) => {
//   try {
//     const countries = await emiratesPostService.getCountries();
//     res.json({
//       success: true,
//       count: countries.length,
//       countries
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // عرض الإمارات المتاحة
// app.get('/emirates', async (req, res) => {
//   try {
//     const emirates = await emiratesPostService.getEmirates();
//     res.json({
//       success: true,
//       count: emirates.length,
//       emirates
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // معالجة الأخطاء العامة
// app.use((err, req, res, next) => {
//   console.error('❌ Unhandled error:', err);
//   res.status(500).json({ rates: [] });
// });

// // بدء الخادم
// app.listen(PORT, () => {
//   console.log(`🚀 Server is running on port ${PORT}`);
//   console.log(`🌐 API Provider: Emirates Post`);
//   console.log(`📍 Endpoints:`);
//   console.log(`   - GET  /`);
//   console.log(`   - POST /shipping-rates (Shopify webhook)`);
//   console.log(`   - GET  /test-rate`);
//   console.log(`   - GET  /countries`);
//   console.log(`   - GET  /emirates`);
//   console.log(`   - GET  /health`);
//   console.log(`✅ Ready to receive requests from Shopify!`);
// });
///////////////////////////////////////////////////////////////////////////////////////////

// require('dotenv').config();
// const express = require('express');
// const emiratesPostService = require('./services/emiratesPostService');
// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(express.json());

// // CORS للسماح لـ Shopify بالاتصال
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200);
//   }
//   next();
// });

// // الصفحة الرئيسية
// app.get('/', (req, res) => {
//   res.json({
//     status: '✅ التطبيق يعمل بنجاح',
//     message: 'تطبيق حساب الشحن عبر API البريد الإماراتي لـ Shopify',
//     version: '2.1.0',
//     apiProvider: 'Emirates Post API',
//     endpoints: {
//       main: 'POST /shipping-rates',
//       test: 'GET /test-rate',
//       countries: 'GET /countries',
//       emirates: 'GET /emirates',
//       health: 'GET /health'
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// // Health check
// app.get('/health', (req, res) => {
//   res.json({
//     status: 'healthy',
//     uptime: process.uptime(),
//     timestamp: new Date().toISOString()
//   });
// });

// // Endpoint الرئيسي لـ Shopify
// app.post('/shipping-rates', async (req, res) => {
//   try {
//     console.log('📦 ===== Shopify Request Received =====');
//     console.log('Full Request Body:', JSON.stringify(req.body, null, 2));

//     const { rate } = req.body;

//     // التحقق من البيانات المطلوبة
//     if (!rate || !rate.destination) {
//       console.error('❌ Invalid request structure');
//       return res.status(200).json({ rates: [] });
//     }

//     const destination = rate.destination;
//     const items = rate.items || [];
    
//     // حساب الوزن الإجمالي والأبعاد
//     let totalWeight = 0;
//     let maxLength = 0;
//     let maxWidth = 0;
//     let maxHeight = 0;
//     let totalVolume = 0;

//     items.forEach(item => {
//       const quantity = item.quantity || 1;
      
//       // حساب الوزن - Shopify يرسله بالجرام في حقل grams
//       const itemWeight = item.grams || 0;
//       totalWeight += itemWeight * quantity;
      
//       console.log(`📦 Item: ${item.name}, Weight: ${itemWeight}g, Qty: ${quantity}`);
      
//       // محاولة قراءة الأبعاد من عدة مصادر محتملة
//       let length = 0, width = 0, height = 0;
      
//       // 1. من variant_id إذا كان موجود (قد يحتوي على الأبعاد)
//       if (item.product_id) {
//         // الأبعاد قد تكون موجودة في metadata
//         if (item.properties) {
//           length = parseFloat(item.properties.length || 0);
//           width = parseFloat(item.properties.width || 0);
//           height = parseFloat(item.properties.height || 0);
//         }
//       }
      
//       // 2. محاولة حساب الأبعاد من الوزن إذا لم تكن متوفرة
//       if (length === 0 && width === 0 && height === 0 && itemWeight > 0) {
//         // حساب تقريبي للأبعاد بناءً على الوزن
//         // نفترض كثافة معينة وشكل مكعب تقريباً
//         const volumeCm3 = itemWeight / 0.5; // كثافة افتراضية
//         const sideLength = Math.cbrt(volumeCm3); // طول ضلع المكعب
        
//         length = Math.max(10, Math.ceil(sideLength * 1.5)); // نجعله مستطيل
//         width = Math.max(10, Math.ceil(sideLength));
//         height = Math.max(5, Math.ceil(sideLength * 0.7));
//       }
      
//       // تحديث القيم القصوى
//       maxLength = Math.max(maxLength, length * quantity);
//       maxWidth = Math.max(maxWidth, width);
//       maxHeight = Math.max(maxHeight, height);
      
//       // حساب الحجم الإجمالي
//       totalVolume += (length * width * height) * quantity;
      
//       console.log(`📏 Item Dimensions: ${length}x${width}x${height}cm`);
//     });

//     // قيم افتراضية إذا لم تكن البيانات متوفرة
//     if (totalWeight === 0) {
//       console.log('⚠️ No weight found, using default 500g');
//       totalWeight = 500;
//     }
    
//     // إذا لم نجد أبعاد محددة، نستخدم قيم افتراضية بناءً على الوزن
//     if (maxLength === 0 || maxWidth === 0 || maxHeight === 0) {
//       console.log('⚠️ No dimensions found, calculating from weight');
      
//       // حساب أبعاد تقريبية بناءً على الوزن
//       if (totalWeight <= 500) {
//         maxLength = 20;
//         maxWidth = 15;
//         maxHeight = 10;
//       } else if (totalWeight <= 1000) {
//         maxLength = 30;
//         maxWidth = 20;
//         maxHeight = 15;
//       } else if (totalWeight <= 2000) {
//         maxLength = 40;
//         maxWidth = 30;
//         maxHeight = 20;
//       } else {
//         // للأوزان الأثقل
//         maxLength = 50;
//         maxWidth = 40;
//         maxHeight = 30;
//       }
//     }

//     console.log(`📊 Final Calculated Values:`);
//     console.log(`   Total Weight: ${totalWeight}g`);
//     console.log(`   Dimensions: ${maxLength}x${maxWidth}x${maxHeight}cm`);

//     const countryCode = destination.country ? destination.country.toUpperCase() : '';
//     const isUAE = countryCode === 'AE';

//     console.log(`🌍 Destination: ${countryCode} - ${isUAE ? 'Domestic' : 'International'}`);

//     let shippingRate;

//     if (isUAE) {
//       // شحن محلي داخل الإمارات
//       const cityId = emiratesPostService.getCityIdFromName(destination.city);
//       shippingRate = await emiratesPostService.calculateDomesticRate({
//         originCity: process.env.DEFAULT_ORIGIN_CITY || '3',
//         destinationCity: cityId,
//         weight: totalWeight,
//         length: maxLength,
//         width: maxWidth,
//         height: maxHeight
//       });
//     } else {
//       // شحن دولي
//       shippingRate = await emiratesPostService.calculateInternationalRate({
//         destinationCountry: countryCode,
//         destinationCity: destination.city || '',
//         weight: totalWeight,
//         length: maxLength,
//         width: maxWidth,
//         height: maxHeight
//       });
//     }

//     if (!shippingRate) {
//       console.log('⚠️ No shipping rate available');
//       return res.status(200).json({ rates: [] });
//     }

//     // تحويل السعر إلى فلس (cents)
//     const priceInCents = Math.round(shippingRate.price * 100);

//     const response = {
//       rates: [
//         {
//           service_name: shippingRate.serviceName,
//           service_code: shippingRate.serviceCode,
//           total_price: priceInCents.toString(),
//           currency: 'AED',
//           description: shippingRate.description || `Weight: ${totalWeight}g, Size: ${maxLength}x${maxWidth}x${maxHeight}cm`
//         }
//       ]
//     };

//     console.log('✅ Response sent:', JSON.stringify(response, null, 2));
//     console.log('========================================');

//     return res.status(200)
//       .set('Content-Type', 'application/json')
//       .json(response);

//   } catch (error) {
//     console.error('❌ Error in /shipping-rates:', error.message);
//     console.error('Error stack:', error.stack);
//     return res.status(200).json({ rates: [] });
//   }
// });

// // Endpoint لاختبار حساب السعر
// app.get('/test-rate', async (req, res) => {
//   try {
//     const testData = {
//       destinationCountry: 'JO',
//       destinationCity: 'Amman',
//       weight: 1000,
//       length: 20,
//       width: 15,
//       height: 10
//     };

//     const rate = await emiratesPostService.calculateInternationalRate(testData);
    
//     res.json({
//       success: true,
//       testData,
//       result: rate
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // عرض الدول المتاحة
// app.get('/countries', async (req, res) => {
//   try {
//     const countries = await emiratesPostService.getCountries();
//     res.json({
//       success: true,
//       count: countries.length,
//       countries
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // عرض الإمارات المتاحة
// app.get('/emirates', async (req, res) => {
//   try {
//     const emirates = await emiratesPostService.getEmirates();
//     res.json({
//       success: true,
//       count: emirates.length,
//       emirates
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // معالجة الأخطاء العامة
// app.use((err, req, res, next) => {
//   console.error('❌ Unhandled error:', err);
//   res.status(500).json({ rates: [] });
// });

// // بدء الخادم
// app.listen(PORT, () => {
//   console.log(`🚀 Server is running on port ${PORT}`);
//   console.log(`🌐 API Provider: Emirates Post`);
//   console.log(`📍 Endpoints:`);
//   console.log(`   - GET  /`);
//   console.log(`   - POST /shipping-rates (Shopify webhook)`);
//   console.log(`   - GET  /test-rate`);
//   console.log(`   - GET  /countries`);
//   console.log(`   - GET  /emirates`);
//   console.log(`   - GET  /health`);
//   console.log(`✅ Ready to receive requests from Shopify!`);
// });

////////////////////////////////////////////////////////////////////////////////////
// require('dotenv').config();
// const express = require('express');
// const emiratesPostService = require('./services/emiratesPostService');
// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(express.json());

// // CORS للسماح لـ Shopify بالاتصال
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200);
//   }
//   next();
// });

// // الصفحة الرئيسية
// app.get('/', (req, res) => {
//   res.json({
//     status: '✅ التطبيق يعمل بنجاح',
//     message: 'تطبيق حساب الشحن عبر API البريد الإماراتي لـ Shopify',
//     version: '2.2.0',
//     apiProvider: 'Emirates Post API',
//     shippingType: 'STANDARD Service (PRO-712)',
//     endpoints: {
//       main: 'POST /shipping-rates',
//       test: 'GET /test-rate',
//       testPostman: 'POST /test-shopify-request',
//       countries: 'GET /countries',
//       emirates: 'GET /emirates',
//       health: 'GET /health'
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// // Health check
// app.get('/health', (req, res) => {
//   res.json({
//     status: 'healthy',
//     uptime: process.uptime(),
//     timestamp: new Date().toISOString()
//   });
// });

// // Endpoint الرئيسي لـ Shopify
// app.post('/shipping-rates', async (req, res) => {
//   try {
//     console.log('\n' + '='.repeat(80));
//     console.log('📦 NEW SHOPIFY REQUEST RECEIVED');
//     console.log('⏰ Time:', new Date().toISOString());
//     console.log('='.repeat(80));
//     console.log('📋 Full Request Body:');
//     console.log(JSON.stringify(req.body, null, 2));
//     console.log('-'.repeat(80));

//     const { rate } = req.body;

//     // التحقق من البيانات المطلوبة
//     if (!rate || !rate.destination) {
//       console.error('❌ Invalid request structure');
//       return res.status(200).json({ rates: [] });
//     }

//     const destination = rate.destination;
//     const items = rate.items || [];
    
//     console.log('📍 DESTINATION DETAILS:');
//     console.log(`   Country Code: ${destination.country}`);
//     console.log(`   City: ${destination.city}`);
//     console.log(`   Province: ${destination.province}`);
//     console.log(`   Postal Code: ${destination.postal_code}`);
//     console.log('-'.repeat(80));
    
//     // حساب الوزن الإجمالي والأبعاد
//     let totalWeight = 0;
//     let maxLength = 0;
//     let maxWidth = 0;
//     let maxHeight = 0;

//     console.log('📦 ITEMS ANALYSIS:');
//     items.forEach((item, index) => {
//       const quantity = item.quantity || 1;
//       const itemWeight = item.grams || 0;
//       totalWeight += itemWeight * quantity;
      
//       console.log(`\n   Item #${index + 1}:`);
//       console.log(`   - Name: ${item.name}`);
//       console.log(`   - SKU: ${item.sku || 'N/A'}`);
//       console.log(`   - Weight: ${itemWeight}g`);
//       console.log(`   - Quantity: ${quantity}`);
//       console.log(`   - Total Weight: ${itemWeight * quantity}g`);
      
//       // محاولة قراءة الأبعاد
//       let length = 0, width = 0, height = 0;
      
//       if (item.properties) {
//         length = parseFloat(item.properties.length || 0);
//         width = parseFloat(item.properties.width || 0);
//         height = parseFloat(item.properties.height || 0);
//       }
      
//       // حساب تقريبي للأبعاد إذا لم تكن متوفرة
//       if (length === 0 && width === 0 && height === 0 && itemWeight > 0) {
//         const volumeCm3 = itemWeight / 0.5;
//         const sideLength = Math.cbrt(volumeCm3);
        
//         length = Math.max(10, Math.ceil(sideLength * 1.5));
//         width = Math.max(10, Math.ceil(sideLength));
//         height = Math.max(5, Math.ceil(sideLength * 0.7));
//       }
      
//       maxLength = Math.max(maxLength, length);
//       maxWidth = Math.max(maxWidth, width);
//       maxHeight = Math.max(maxHeight, height);
      
//       console.log(`   - Dimensions: ${length}x${width}x${height}cm`);
//     });

//     // قيم افتراضية إذا لم تكن البيانات متوفرة
//     if (totalWeight === 0) {
//       console.log('\n⚠️  No weight found, using default 500g');
//       totalWeight = 500;
//     }
    
//     if (maxLength === 0 || maxWidth === 0 || maxHeight === 0) {
//       console.log('⚠️  No dimensions found, calculating from weight');
      
//       if (totalWeight <= 500) {
//         maxLength = 20; maxWidth = 15; maxHeight = 10;
//       } else if (totalWeight <= 1000) {
//         maxLength = 30; maxWidth = 20; maxHeight = 15;
//       } else if (totalWeight <= 2000) {
//         maxLength = 40; maxWidth = 30; maxHeight = 20;
//       } else {
//         maxLength = 50; maxWidth = 40; maxHeight = 30;
//       }
//     }

//     console.log('\n' + '='.repeat(80));
//     console.log('📊 FINAL SHIPMENT DETAILS:');
//     console.log(`   Total Weight: ${totalWeight}g`);
//     console.log(`   Package Dimensions: ${maxLength} x ${maxWidth} x ${maxHeight} cm`);
//     console.log(`   Volume: ${(maxLength * maxWidth * maxHeight).toFixed(2)} cm³`);
//     console.log('='.repeat(80));

//     const countryCode = destination.country ? destination.country.toUpperCase() : '';
//     const isUAE = countryCode === 'AE';

//     console.log(`\n🌍 SHIPPING TYPE: ${isUAE ? '🇦🇪 DOMESTIC (UAE)' : '🌏 INTERNATIONAL'}`);
//     console.log(`   Destination Country: ${countryCode}`);
//     console.log('-'.repeat(80));

//     let shippingRate;

//     if (isUAE) {
//       console.log('🚚 Calling DOMESTIC rate calculation...\n');
//       const cityId = emiratesPostService.getCityIdFromName(destination.city);
//       shippingRate = await emiratesPostService.calculateDomesticRate({
//         originCity: process.env.DEFAULT_ORIGIN_CITY || '3',
//         destinationCity: cityId,
//         weight: totalWeight,
//         length: maxLength,
//         width: maxWidth,
//         height: maxHeight
//       });
//     } else {
//       console.log('✈️  Calling INTERNATIONAL rate calculation...\n');
//       shippingRate = await emiratesPostService.calculateInternationalRate({
//         destinationCountry: countryCode,
//         destinationCity: destination.city || '',
//         weight: totalWeight,
//         length: maxLength,
//         width: maxWidth,
//         height: maxHeight
//       });
//     }

//     if (!shippingRate) {
//       console.log('\n❌ No shipping rate returned from Emirates Post');
//       console.log('='.repeat(80) + '\n');
//       return res.status(200).json({ rates: [] });
//     }

//     // تحويل السعر إلى فلس (cents)
//     const priceInCents = Math.round(shippingRate.price * 100);

//     const response = {
//       rates: [
//         {
//           service_name: shippingRate.serviceName,
//           service_code: shippingRate.serviceCode,
//           total_price: priceInCents.toString(),
//           currency: 'AED',
//           description: shippingRate.description || `Weight: ${totalWeight}g, Size: ${maxLength}x${maxWidth}x${maxHeight}cm`
//         }
//       ]
//     };

//     console.log('\n' + '='.repeat(80));
//     console.log('✅ SUCCESS - RESPONSE TO SHOPIFY:');
//     console.log(JSON.stringify(response, null, 2));
//     console.log('='.repeat(80) + '\n');

//     return res.status(200)
//       .set('Content-Type', 'application/json')
//       .json(response);

//   } catch (error) {
//     console.error('\n' + '='.repeat(80));
//     console.error('❌ CRITICAL ERROR in /shipping-rates:');
//     console.error('Error Message:', error.message);
//     console.error('Error Stack:', error.stack);
//     console.error('='.repeat(80) + '\n');
//     return res.status(200).json({ rates: [] });
//   }
// });

// // ✅ Endpoint جديد لاختبار عبر Postman
// app.post('/test-shopify-request', async (req, res) => {
//   try {
//     console.log('\n🧪 TEST REQUEST RECEIVED');
    
//     // محاكاة طلب Shopify
//     const testRequest = {
//       rate: {
//         origin: {
//           country: "AE",
//           postal_code: "",
//           province: "Dubai",
//           city: "Dubai",
//           name: null,
//           address1: "",
//           address2: "",
//           address3: null,
//           phone: "",
//           fax: null,
//           email: null,
//           address_type: null,
//           company_name: ""
//         },
//         destination: {
//           country: req.body.country || "JO",
//           postal_code: req.body.postal_code || "",
//           province: req.body.province || "",
//           city: req.body.city || "Amman",
//           name: null,
//           address1: "",
//           address2: "",
//           address3: null,
//           phone: "",
//           fax: null,
//           email: null,
//           address_type: null,
//           company_name: ""
//         },
//         items: [
//           {
//             name: req.body.item_name || "Test Product",
//             sku: "TEST-SKU",
//             quantity: req.body.quantity || 1,
//             grams: req.body.weight || 250,
//             price: 10000,
//             vendor: "Test Vendor",
//             requires_shipping: true,
//             taxable: true,
//             fulfillment_service: "manual",
//             properties: null,
//             product_id: null,
//             variant_id: null
//           }
//         ],
//         currency: "AED",
//         locale: "en"
//       }
//     };
    
//     // استدعاء الـ endpoint الرئيسي
//     req.body = testRequest;
    
//     // إعادة استخدام logic من /shipping-rates
//     const { rate } = testRequest;
//     const destination = rate.destination;
//     const items = rate.items;
    
//     let totalWeight = 0;
//     items.forEach(item => {
//       totalWeight += (item.grams || 0) * (item.quantity || 1);
//     });
    
//     // استخدام أبعاد افتراضية
//     const dimensions = {
//       length: 20,
//       width: 15,
//       height: 10
//     };
    
//     const countryCode = destination.country.toUpperCase();
//     const isUAE = countryCode === 'AE';
    
//     let shippingRate;
    
//     if (isUAE) {
//       const cityId = emiratesPostService.getCityIdFromName(destination.city);
//       shippingRate = await emiratesPostService.calculateDomesticRate({
//         originCity: '3',
//         destinationCity: cityId,
//         weight: totalWeight,
//         ...dimensions
//       });
//     } else {
//       shippingRate = await emiratesPostService.calculateInternationalRate({
//         destinationCountry: countryCode,
//         destinationCity: destination.city,
//         weight: totalWeight,
//         ...dimensions
//       });
//     }
    
//     if (!shippingRate) {
//       return res.json({
//         success: false,
//         message: 'No rate returned from Emirates Post',
//         testRequest
//       });
//     }
    
//     const priceInCents = Math.round(shippingRate.price * 100);
    
//     res.json({
//       success: true,
//       message: 'Test completed successfully',
//       testRequest,
//       emiratesPostResponse: shippingRate.details,
//       shopifyResponse: {
//         rates: [{
//           service_name: shippingRate.serviceName,
//           service_code: shippingRate.serviceCode,
//           total_price: priceInCents.toString(),
//           currency: 'AED',
//           price_in_aed: shippingRate.price
//         }]
//       }
//     });
    
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       stack: error.stack
//     });
//   }
// });

// // Endpoint لاختبار حساب السعر
// app.get('/test-rate', async (req, res) => {
//   try {
//     const testData = {
//       destinationCountry: 'JO',
//       destinationCity: 'Amman',
//       weight: 250,
//       length: 20,
//       width: 15,
//       height: 10
//     };

//     console.log('\n🧪 Running test with data:', testData);
//     const rate = await emiratesPostService.calculateInternationalRate(testData);
    
//     res.json({
//       success: true,
//       testData,
//       result: rate,
//       priceInAED: rate ? rate.price : null,
//       priceInCents: rate ? Math.round(rate.price * 100) : null
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // عرض الدول المتاحة
// app.get('/countries', async (req, res) => {
//   try {
//     const countries = await emiratesPostService.getCountries();
//     res.json({
//       success: true,
//       count: countries.length,
//       countries
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // عرض الإمارات المتاحة
// app.get('/emirates', async (req, res) => {
//   try {
//     const emirates = await emiratesPostService.getEmirates();
//     res.json({
//       success: true,
//       count: emirates.length,
//       emirates
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // معالجة الأخطاء العامة
// app.use((err, req, res, next) => {
//   console.error('❌ Unhandled error:', err);
//   res.status(500).json({ rates: [] });
// });

// // بدء الخادم
// app.listen(PORT, () => {
//   console.log('\n' + '='.repeat(80));
//   console.log('🚀 SERVER STARTED SUCCESSFULLY');
//   console.log('='.repeat(80));
//   console.log(`📡 Port: ${PORT}`);
//   console.log(`🌐 API Provider: Emirates Post`);
//   console.log(`📦 Shipping Type: STANDARD Service (PRO-712)`);
//   console.log(`\n📍 Available Endpoints:`);
//   console.log(`   - GET  / (Info)`);
//   console.log(`   - POST /shipping-rates (Shopify webhook)`);
//   console.log(`   - POST /test-shopify-request (Postman testing)`);
//   console.log(`   - GET  /test-rate (Quick test)`);
//   console.log(`   - GET  /countries`);
//   console.log(`   - GET  /emirates`);
//   console.log(`   - GET  /health`);
//   console.log('='.repeat(80));
//   console.log('✅ Ready to receive requests from Shopify!');
//   console.log('='.repeat(80) + '\n');
// });

// // أضف هذه الـ endpoints في server.js بعد الـ endpoints الموجودة

// // 🔍 Endpoint لاختبار جميع أكواد الخدمات
// app.post('/test-all-services', async (req, res) => {
//   try {
//     const { country, weight } = req.body;
    
//     const testData = {
//       destinationCountry: country || 'JO',
//       destinationCity: 'Amman',
//       weight: weight || 250,
//       length: 20,
//       width: 15,
//       height: 10
//     };

//     console.log('\n🧪 Testing all service types...');
//     console.log('Test data:', testData);

//     // احصل على معرف الدولة
//     const countryId = await emiratesPostService.getCountryIdByCode(testData.destinationCountry);
    
//     if (!countryId) {
//       return res.json({
//         success: false,
//         error: `Country ${testData.destinationCountry} not found`
//       });
//     }

//     // قائمة الخدمات للاختبار
//     const services = [
//       { name: 'Standard PRO-712', ShipmentType: 'Standard', ProductCode: 'PRO-712' },
//       { name: 'Economy PRO-713', ShipmentType: 'Economy', ProductCode: 'PRO-713' },
//       { name: 'Premium PRO-26', ShipmentType: 'Premium', ProductCode: 'PRO-26' },
//       { name: 'EMX DOU PRO-272', ShipmentType: 'Premium', ProductCode: 'PRO-272' },
//       { name: 'EMX DDU PRO-273', ShipmentType: 'Premium', ProductCode: 'PRO-273' }
//     ];

//     const results = [];

//     for (const service of services) {
//       console.log(`\nTesting ${service.name}...`);
      
//       const requestBody = {
//         RateCalculationRequest: {
//           ShipmentType: service.ShipmentType,
//           ServiceType: "International",
//           OriginState: "",
//           OriginCity: parseInt(process.env.DEFAULT_ORIGIN_CITY || '3'),
//           DestinationCountry: parseInt(countryId),
//           DestinationState: "",
//           DestinationCity: testData.destinationCity,
//           Length: Math.ceil(testData.length),
//           Width: Math.ceil(testData.width),
//           Height: Math.ceil(testData.height),
//           Weight: Math.ceil(testData.weight),
//           CalculationCurrencyCode: "AED",
//           ContentTypeCode: "NonDocument",
//           DimensionUnit: "Centimetre",
//           WeightUnit: "Grams",
//           IsRegistered: "No",
//           ProductCode: service.ProductCode
//         }
//       };

//       try {
//         const response = await axios.post(
//           `${process.env.EMIRATES_POST_API_URL}/ratecalculator/rest/CalculatePriceRate`,
//           requestBody,
//           {
//             headers: {
//               'Content-Type': 'application/json',
//               'AccountNo': process.env.EMIRATES_POST_ACCOUNT_NO,
//               'Password': process.env.EMIRATES_POST_PASSWORD
//             }
//           }
//         );

//         const rateData = response.data.RateCalculationResponse;
//         const price = parseFloat(rateData.TotalRate || rateData.BaseRate || 0);

//         results.push({
//           service: service.name,
//           status: price > 0 ? '✅ SUCCESS' : '⚠️ ZERO PRICE',
//           price: price,
//           baseRate: rateData.BaseRate,
//           totalRate: rateData.TotalRate,
//           fullResponse: rateData
//         });

//         console.log(`✅ ${service.name}: ${price} AED`);
//       } catch (error) {
//         results.push({
//           service: service.name,
//           status: '❌ FAILED',
//           error: error.message,
//           errorDetails: error.response?.data
//         });
//         console.log(`❌ ${service.name} failed: ${error.message}`);
//       }
//     }

//     res.json({
//       success: true,
//       testData,
//       results,
//       recommendation: results.find(r => r.status === '✅ SUCCESS')?.service || 'None worked'
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // 🔍 Endpoint للتحقق من الاتصال بـ API
// app.get('/test-api-connection', async (req, res) => {
//   try {
//     console.log('\n🔌 Testing API connection...');
//     console.log('API URL:', process.env.EMIRATES_POST_API_URL);
//     console.log('Account:', process.env.EMIRATES_POST_ACCOUNT_NO);
    
//     // اختبار 1: جلب الدول
//     let countriesTest;
//     try {
//       const countriesResponse = await axios.get(
//         `${process.env.EMIRATES_POST_API_URL}/lookups/rest/GetCountries`
//       );
//       countriesTest = {
//         status: '✅ Success',
//         count: countriesResponse.data?.CountriesResponse?.Countries?.Country?.length || 0
//       };
//     } catch (error) {
//       countriesTest = {
//         status: '❌ Failed',
//         error: error.message
//       };
//     }

//     // اختبار 2: جلب الإمارات
//     let emiratesTest;
//     try {
//       const emiratesResponse = await axios.get(
//         `${process.env.EMIRATES_POST_API_URL}/lookups/rest/GetEmiratesDetails`
//       );
//       emiratesTest = {
//         status: '✅ Success',
//         count: emiratesResponse.data?.GetEmiratesDetailsResult?.EmirateBO?.length || 0
//       };
//     } catch (error) {
//       emiratesTest = {
//         status: '❌ Failed',
//         error: error.message
//       };
//     }

//     // اختبار 3: حساب سعر بسيط
//     let rateTest;
//     try {
//       const rateResponse = await axios.post(
//         `${process.env.EMIRATES_POST_API_URL}/ratecalculator/rest/CalculatePriceRate`,
//         {
//           RateCalculationRequest: {
//             ShipmentType: "Premium",
//             ServiceType: "International",
//             OriginCity: 3,
//             DestinationCountry: 972, // Jordan
//             Length: 20,
//             Width: 15,
//             Height: 10,
//             Weight: 250,
//             CalculationCurrencyCode: "AED",
//             ContentTypeCode: "NonDocument",
//             DimensionUnit: "Centimetre",
//             WeightUnit: "Grams",
//             IsRegistered: "No",
//             ProductCode: "PRO-26"
//           }
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'AccountNo': process.env.EMIRATES_POST_ACCOUNT_NO,
//             'Password': process.env.EMIRATES_POST_PASSWORD
//           }
//         }
//       );
      
//       const rate = rateResponse.data.RateCalculationResponse;
//       rateTest = {
//         status: '✅ Success',
//         price: rate.TotalRate || rate.BaseRate,
//         fullResponse: rate
//       };
//     } catch (error) {
//       rateTest = {
//         status: '❌ Failed',
//         error: error.message,
//         errorDetails: error.response?.data
//       };
//     }

//     res.json({
//       apiConnection: {
//         url: process.env.EMIRATES_POST_API_URL,
//         account: process.env.EMIRATES_POST_ACCOUNT_NO
//       },
//       tests: {
//         getCountries: countriesTest,
//         getEmirates: emiratesTest,
//         calculateRate: rateTest
//       },
//       overallStatus: 
//         countriesTest.status === '✅ Success' &&
//         emiratesTest.status === '✅ Success' &&
//         rateTest.status === '✅ Success'
//           ? '✅ All tests passed'
//           : '❌ Some tests failed'
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // 🔍 Endpoint للبحث عن دولة معينة
// app.get('/find-country/:code', async (req, res) => {
//   try {
//     const countryCode = req.params.code.toUpperCase();
//     const countries = await emiratesPostService.getCountries();
    
//     const country = countries.find(c => c.CountryCode === countryCode);
    
//     if (country) {
//       res.json({
//         success: true,
//         found: true,
//         country: country,
//         message: `Found: ${country.CountryName} (ID: ${country.CountryId})`
//       });
//     } else {
//       // ابحث عن دول مشابهة
//       const similar = countries.filter(c => 
//         c.CountryCode.includes(countryCode) || 
//         c.CountryName.toLowerCase().includes(countryCode.toLowerCase())
//       );
      
//       res.json({
//         success: true,
//         found: false,
//         message: `Country code ${countryCode} not found`,
//         similarCountries: similar.slice(0, 10)
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

require('dotenv').config();
const express = require('express');
const axios = require('axios'); // ✅ هذا كان ناقص!
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
    version: '2.3.0',
    apiProvider: 'Emirates Post API',
    shippingType: 'Multi-Service with Auto Fallback',
    endpoints: {
      main: 'POST /shipping-rates',
      test: 'GET /test-rate',
      testPostman: 'POST /test-shopify-request',
      testAllServices: 'POST /test-all-services',
      testConnection: 'GET /test-api-connection',
      findCountry: 'GET /find-country/:code',
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
    console.log('\n' + '='.repeat(80));
    console.log('📦 NEW SHOPIFY REQUEST RECEIVED');
    console.log('⏰ Time:', new Date().toISOString());
    console.log('='.repeat(80));
    console.log('📋 Full Request Body:');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('-'.repeat(80));

    const { rate } = req.body;

    if (!rate || !rate.destination) {
      console.error('❌ Invalid request structure');
      return res.status(200).json({ rates: [] });
    }

    const destination = rate.destination;
    const items = rate.items || [];
    
    console.log('📍 DESTINATION DETAILS:');
    console.log(`   Country Code: ${destination.country}`);
    console.log(`   City: ${destination.city}`);
    console.log(`   Province: ${destination.province}`);
    console.log(`   Postal Code: ${destination.postal_code}`);
    console.log('-'.repeat(80));
    
    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    console.log('📦 ITEMS ANALYSIS:');
    items.forEach((item, index) => {
      const quantity = item.quantity || 1;
      const itemWeight = item.grams || 0;
      totalWeight += itemWeight * quantity;
      
      console.log(`\n   Item #${index + 1}:`);
      console.log(`   - Name: ${item.name}`);
      console.log(`   - SKU: ${item.sku || 'N/A'}`);
      console.log(`   - Weight: ${itemWeight}g`);
      console.log(`   - Quantity: ${quantity}`);
      console.log(`   - Total Weight: ${itemWeight * quantity}g`);
      
      let length = 0, width = 0, height = 0;
      
      if (item.properties) {
        length = parseFloat(item.properties.length || 0);
        width = parseFloat(item.properties.width || 0);
        height = parseFloat(item.properties.height || 0);
      }
      
      if (length === 0 && width === 0 && height === 0 && itemWeight > 0) {
        const volumeCm3 = itemWeight / 0.5;
        const sideLength = Math.cbrt(volumeCm3);
        
        length = Math.max(10, Math.ceil(sideLength * 1.5));
        width = Math.max(10, Math.ceil(sideLength));
        height = Math.max(5, Math.ceil(sideLength * 0.7));
      }
      
      maxLength = Math.max(maxLength, length);
      maxWidth = Math.max(maxWidth, width);
      maxHeight = Math.max(maxHeight, height);
      
      console.log(`   - Dimensions: ${length}x${width}x${height}cm`);
    });

    if (totalWeight === 0) {
      console.log('\n⚠️  No weight found, using default 500g');
      totalWeight = 500;
    }
    
    if (maxLength === 0 || maxWidth === 0 || maxHeight === 0) {
      console.log('⚠️  No dimensions found, calculating from weight');
      
      if (totalWeight <= 500) {
        maxLength = 20; maxWidth = 15; maxHeight = 10;
      } else if (totalWeight <= 1000) {
        maxLength = 30; maxWidth = 20; maxHeight = 15;
      } else if (totalWeight <= 2000) {
        maxLength = 40; maxWidth = 30; maxHeight = 20;
      } else {
        maxLength = 50; maxWidth = 40; maxHeight = 30;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL SHIPMENT DETAILS:');
    console.log(`   Total Weight: ${totalWeight}g`);
    console.log(`   Package Dimensions: ${maxLength} x ${maxWidth} x ${maxHeight} cm`);
    console.log('='.repeat(80));

    const countryCode = destination.country ? destination.country.toUpperCase() : '';
    const isUAE = countryCode === 'AE';

    console.log(`\n🌍 SHIPPING TYPE: ${isUAE ? '🇦🇪 DOMESTIC (UAE)' : '🌏 INTERNATIONAL'}`);
    console.log(`   Destination Country: ${countryCode}`);
    console.log('-'.repeat(80));

    let shippingRate;

    if (isUAE) {
      console.log('🚚 Calling DOMESTIC rate calculation...\n');
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
      console.log('✈️  Calling INTERNATIONAL rate calculation...\n');
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
      console.log('\n❌ No shipping rate returned from Emirates Post');
      console.log('='.repeat(80) + '\n');
      return res.status(200).json({ rates: [] });
    }

    const priceInCents = Math.round(shippingRate.price * 100);

    const response = {
      rates: [
        {
          service_name: shippingRate.serviceName,
          service_code: shippingRate.serviceCode,
          total_price: priceInCents.toString(),
          currency: 'AED',
          description: shippingRate.description
        }
      ]
    };

    console.log('\n' + '='.repeat(80));
    console.log('✅ SUCCESS - RESPONSE TO SHOPIFY:');
    console.log(JSON.stringify(response, null, 2));
    console.log('='.repeat(80) + '\n');

    return res.status(200)
      .set('Content-Type', 'application/json')
      .json(response);

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ CRITICAL ERROR in /shipping-rates:');
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('='.repeat(80) + '\n');
    return res.status(200).json({ rates: [] });
  }
});

// ✅ Endpoint لاختبار عبر Postman
app.post('/test-shopify-request', async (req, res) => {
  try {
    console.log('\n🧪 TEST REQUEST RECEIVED');
    
    const testRequest = {
      rate: {
        origin: {
          country: "AE",
          postal_code: "",
          province: "Dubai",
          city: "Dubai",
          name: null,
          address1: "",
          address2: "",
          address3: null,
          phone: "",
          fax: null,
          email: null,
          address_type: null,
          company_name: ""
        },
        destination: {
          country: req.body.country || "JO",
          postal_code: req.body.postal_code || "",
          province: req.body.province || "",
          city: req.body.city || "Amman",
          name: null,
          address1: "",
          address2: "",
          address3: null,
          phone: "",
          fax: null,
          email: null,
          address_type: null,
          company_name: ""
        },
        items: [
          {
            name: req.body.item_name || "Test Product",
            sku: "TEST-SKU",
            quantity: req.body.quantity || 1,
            grams: req.body.weight || 250,
            price: 10000,
            vendor: "Test Vendor",
            requires_shipping: true,
            taxable: true,
            fulfillment_service: "manual",
            properties: null,
            product_id: null,
            variant_id: null
          }
        ],
        currency: "AED",
        locale: "en"
      }
    };
    
    const { rate } = testRequest;
    const destination = rate.destination;
    const items = rate.items;
    
    let totalWeight = 0;
    items.forEach(item => {
      totalWeight += (item.grams || 0) * (item.quantity || 1);
    });
    
    const dimensions = {
      length: 20,
      width: 15,
      height: 10
    };
    
    const countryCode = destination.country.toUpperCase();
    const isUAE = countryCode === 'AE';
    
    let shippingRate;
    
    if (isUAE) {
      const cityId = emiratesPostService.getCityIdFromName(destination.city);
      shippingRate = await emiratesPostService.calculateDomesticRate({
        originCity: '3',
        destinationCity: cityId,
        weight: totalWeight,
        ...dimensions
      });
    } else {
      shippingRate = await emiratesPostService.calculateInternationalRate({
        destinationCountry: countryCode,
        destinationCity: destination.city,
        weight: totalWeight,
        ...dimensions
      });
    }
    
    if (!shippingRate) {
      return res.json({
        success: false,
        message: 'No rate returned from Emirates Post',
        testRequest
      });
    }
    
    const priceInCents = Math.round(shippingRate.price * 100);
    
    res.json({
      success: true,
      message: 'Test completed successfully',
      testRequest,
      emiratesPostResponse: shippingRate.details,
      shopifyResponse: {
        rates: [{
          service_name: shippingRate.serviceName,
          service_code: shippingRate.serviceCode,
          total_price: priceInCents.toString(),
          currency: 'AED',
          price_in_aed: shippingRate.price
        }]
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// 🔍 Endpoint لاختبار جميع أكواد الخدمات
app.post('/test-all-services', async (req, res) => {
  try {
    const { country, weight } = req.body;
    
    const testData = {
      destinationCountry: country || 'JO',
      destinationCity: 'Amman',
      weight: weight || 250,
      length: 20,
      width: 15,
      height: 10
    };

    console.log('\n🧪 Testing all service types...');
    console.log('Test data:', testData);

    const countryId = await emiratesPostService.getCountryIdByCode(testData.destinationCountry);
    
    if (!countryId) {
      return res.json({
        success: false,
        error: `Country ${testData.destinationCountry} not found`
      });
    }

    const services = [
      { name: 'Standard PRO-712', ShipmentType: 'Standard', ProductCode: 'PRO-712' },
      { name: 'Economy PRO-713', ShipmentType: 'Economy', ProductCode: 'PRO-713' },
      { name: 'Premium PRO-26', ShipmentType: 'Premium', ProductCode: 'PRO-26' },
      { name: 'EMX DOU PRO-272', ShipmentType: 'Premium', ProductCode: 'PRO-272' },
      { name: 'EMX DDU PRO-273', ShipmentType: 'Premium', ProductCode: 'PRO-273' }
    ];

    const results = [];

    for (const service of services) {
      console.log(`\nTesting ${service.name}...`);
      
      const requestBody = {
        RateCalculationRequest: {
          ShipmentType: service.ShipmentType,
          ServiceType: "International",
          OriginState: "",
          OriginCity: parseInt(process.env.DEFAULT_ORIGIN_CITY || '3'),
          DestinationCountry: parseInt(countryId),
          DestinationState: "",
          DestinationCity: testData.destinationCity,
          Length: Math.ceil(testData.length),
          Width: Math.ceil(testData.width),
          Height: Math.ceil(testData.height),
          Weight: Math.ceil(testData.weight),
          CalculationCurrencyCode: "AED",
          ContentTypeCode: "NonDocument",
          DimensionUnit: "Centimetre",
          WeightUnit: "Grams",
          IsRegistered: "No",
          ProductCode: service.ProductCode
        }
      };

      try {
        const response = await axios.post(
          `${process.env.EMIRATES_POST_API_URL}/ratecalculator/rest/CalculatePriceRate`,
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
              'AccountNo': process.env.EMIRATES_POST_ACCOUNT_NO,
              'Password': process.env.EMIRATES_POST_PASSWORD
            }
          }
        );

        const rateData = response.data.RateCalculationResponse;
        const price = parseFloat(rateData.TotalRate || rateData.BaseRate || 0);

        results.push({
          service: service.name,
          productCode: service.ProductCode,
          status: price > 0 ? '✅ SUCCESS' : '⚠️ ZERO PRICE',
          price: price,
          baseRate: rateData.BaseRate,
          totalRate: rateData.TotalRate,
          fullResponse: rateData
        });

        console.log(`✅ ${service.name}: ${price} AED`);
      } catch (error) {
        results.push({
          service: service.name,
          productCode: service.ProductCode,
          status: '❌ FAILED',
          error: error.message,
          errorDetails: error.response?.data
        });
        console.log(`❌ ${service.name} failed: ${error.message}`);
      }
    }

    const workingService = results.find(r => r.status === '✅ SUCCESS');

    res.json({
      success: true,
      testData,
      results,
      recommendation: workingService ? {
        service: workingService.service,
        productCode: workingService.productCode,
        price: workingService.price
      } : 'None worked - please contact Emirates Post support'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔍 Endpoint للتحقق من الاتصال بـ API
app.get('/test-api-connection', async (req, res) => {
  try {
    console.log('\n🔌 Testing API connection...');
    console.log('API URL:', process.env.EMIRATES_POST_API_URL);
    console.log('Account:', process.env.EMIRATES_POST_ACCOUNT_NO);
    
    let countriesTest;
    try {
      const countriesResponse = await axios.get(
        `${process.env.EMIRATES_POST_API_URL}/lookups/rest/GetCountries`
      );
      countriesTest = {
        status: '✅ Success',
        count: countriesResponse.data?.CountriesResponse?.Countries?.Country?.length || 0
      };
    } catch (error) {
      countriesTest = {
        status: '❌ Failed',
        error: error.message
      };
    }

    let emiratesTest;
    try {
      const emiratesResponse = await axios.get(
        `${process.env.EMIRATES_POST_API_URL}/lookups/rest/GetEmiratesDetails`
      );
      emiratesTest = {
        status: '✅ Success',
        count: emiratesResponse.data?.GetEmiratesDetailsResult?.EmirateBO?.length || 0
      };
    } catch (error) {
      emiratesTest = {
        status: '❌ Failed',
        error: error.message
      };
    }

    let rateTest;
    try {
      const rateResponse = await axios.post(
        `${process.env.EMIRATES_POST_API_URL}/ratecalculator/rest/CalculatePriceRate`,
        {
          RateCalculationRequest: {
            ShipmentType: "Premium",
            ServiceType: "International",
            OriginState: "",
            OriginCity: 3,
            DestinationCountry: 972,
            DestinationState: "",
            DestinationCity: "",
            Length: 20,
            Width: 15,
            Height: 10,
            Weight: 250,
            CalculationCurrencyCode: "AED",
            ContentTypeCode: "NonDocument",
            DimensionUnit: "Centimetre",
            WeightUnit: "Grams",
            IsRegistered: "No",
            ProductCode: "PRO-26"
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'AccountNo': process.env.EMIRATES_POST_ACCOUNT_NO,
            'Password': process.env.EMIRATES_POST_PASSWORD
          }
        }
      );
      
      const rate = rateResponse.data.RateCalculationResponse;
      rateTest = {
        status: '✅ Success',
        price: rate.TotalRate || rate.BaseRate,
        fullResponse: rate
      };
    } catch (error) {
      rateTest = {
        status: '❌ Failed',
        error: error.message,
        errorDetails: error.response?.data
      };
    }

    res.json({
      apiConnection: {
        url: process.env.EMIRATES_POST_API_URL,
        account: process.env.EMIRATES_POST_ACCOUNT_NO
      },
      tests: {
        getCountries: countriesTest,
        getEmirates: emiratesTest,
        calculateRate: rateTest
      },
      overallStatus: 
        countriesTest.status === '✅ Success' &&
        emiratesTest.status === '✅ Success' &&
        rateTest.status === '✅ Success'
          ? '✅ All tests passed'
          : '❌ Some tests failed'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔍 Endpoint للبحث عن دولة معينة
app.get('/find-country/:code', async (req, res) => {
  try {
    const countryCode = req.params.code.toUpperCase();
    const countries = await emiratesPostService.getCountries();
    
    const country = countries.find(c => c.CountryCode === countryCode);
    
    if (country) {
      res.json({
        success: true,
        found: true,
        country: country,
        message: `Found: ${country.CountryName} (ID: ${country.CountryId})`
      });
    } else {
      const similar = countries.filter(c => 
        c.CountryCode.includes(countryCode) || 
        c.CountryName.toLowerCase().includes(countryCode.toLowerCase())
      );
      
      res.json({
        success: true,
        found: false,
        message: `Country code ${countryCode} not found`,
        similarCountries: similar.slice(0, 10)
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/test-rate', async (req, res) => {
  try {
    const testData = {
      destinationCountry: 'JO',
      destinationCity: 'Amman',
      weight: 250,
      length: 20,
      width: 15,
      height: 10
    };

    console.log('\n🧪 Running test with data:', testData);
    const rate = await emiratesPostService.calculateInternationalRate(testData);
    
    res.json({
      success: true,
      testData,
      result: rate,
      priceInAED: rate ? rate.price : null,
      priceInCents: rate ? Math.round(rate.price * 100) : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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

app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ rates: [] });
});

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SERVER STARTED SUCCESSFULLY');
  console.log('='.repeat(80));
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 API Provider: Emirates Post`);
  console.log(`📦 Shipping Type: Multi-Service with Auto Fallback`);
  console.log(`\n📍 Available Endpoints:`);
  console.log(`   - GET  / (Info)`);
  console.log(`   - POST /shipping-rates (Shopify webhook)`);
  console.log(`   - POST /test-shopify-request (Postman testing)`);
  console.log(`   - POST /test-all-services (Test all service codes)`);
  console.log(`   - GET  /test-api-connection (Connection test)`);
  console.log(`   - GET  /find-country/:code (Find country by code)`);
  console.log(`   - GET  /test-rate (Quick test)`);
  console.log(`   - GET  /countries`);
  console.log(`   - GET  /emirates`);
  console.log(`   - GET  /health`);
  console.log('='.repeat(80));
  console.log('✅ Ready to receive requests from Shopify!');
  console.log('='.repeat(80) + '\n');
});