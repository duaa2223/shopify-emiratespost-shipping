// const axios = require('axios');

// const API_BASE_URL = process.env.EMIRATES_POST_API_URL;
// const ACCOUNT_NO = process.env.EMIRATES_POST_ACCOUNT_NO;
// const PASSWORD = process.env.EMIRATES_POST_PASSWORD;

// // كاش للدول والإمارات لتقليل الطلبات
// let countriesCache = null;
// let emiratesCache = null;

// class EmiratesPostService {
  
//   // جلب قائمة الدول
//   async getCountries() {
//     if (countriesCache) {
//       return countriesCache;
//     }

//     try {
//       const response = await axios.get(`${API_BASE_URL}/lookups/rest/GetCountries`);
      
//       if (response.data && response.data.CountriesResponse && response.data.CountriesResponse.Countries) {
//         countriesCache = response.data.CountriesResponse.Countries.Country || [];
//         return countriesCache;
//       }
      
//       return [];
//     } catch (error) {
//       console.error('❌ Error fetching countries:', error.message);
//       return [];
//     }
//   }

//   // جلب قائمة الإمارات
//   async getEmirates() {
//     if (emiratesCache) {
//       return emiratesCache;
//     }

//     try {
//       const response = await axios.get(`${API_BASE_URL}/lookups/rest/GetEmiratesDetails`);
      
//       if (response.data && response.data.GetEmiratesDetailsResult && response.data.GetEmiratesDetailsResult.EmirateBO) {
//         emiratesCache = response.data.GetEmiratesDetailsResult.EmirateBO;
//         return emiratesCache;
//       }
      
//       return [];
//     } catch (error) {
//       console.error('❌ Error fetching emirates:', error.message);
//       return [];
//     }
//   }

//   // الحصول على معرف الدولة من كود الدولة
//   async getCountryIdByCode(countryCode) {
//     const countries = await this.getCountries();
//     const country = countries.find(c => c.CountryCode === countryCode);
//     return country ? country.CountryId : null;
//   }

//   // الحصول على معرف المدينة من اسم المدينة
//   getCityIdFromName(cityName) {
//     // خريطة تقريبية للمدن الرئيسية في الإمارات
//     const cityMap = {
//       'dubai': '3',
//       'abu dhabi': '2',
//       'sharjah': '5',
//       'ajman': '4',
//       'ras al khaimah': '6',
//       'fujairah': '7',
//       'umm al quwain': '8'
//     };

//     if (!cityName) return '3'; // Dubai كقيمة افتراضية
    
//     const normalizedCity = cityName.toLowerCase().trim();
//     return cityMap[normalizedCity] || '3';
//   }

//   // حساب سعر الشحن الدولي
//   async calculateInternationalRate(data) {
//     const {
//       destinationCountry,
//       destinationCity,
//       weight,
//       length,
//       width,
//       height
//     } = data;

//     try {
//       // الحصول على معرف الدولة
//       const countryId = await this.getCountryIdByCode(destinationCountry);
      
//       if (!countryId) {
//         console.log(`⚠️ Country ${destinationCountry} not found in Emirates Post system`);
//         return null;
//       }

//       const requestBody = {
//         RateCalculationRequest: {
//           ShipmentType: "Premium",
//           ServiceType: "International",
//           OriginState: "",
//           OriginCity: parseInt(process.env.DEFAULT_ORIGIN_CITY || '3'),
//           DestinationCountry: parseInt(countryId),
//           DestinationState: "",
//           DestinationCity: destinationCity || "",
//           Length: Math.ceil(length),
//           Width: Math.ceil(width),
//           Height: Math.ceil(height),
//           Weight: Math.ceil(weight),
//           CalculationCurrencyCode: "AED",
//           ContentTypeCode: "NonDocument",
//           DimensionUnit: "Centimetre",
//           WeightUnit: "Grams",
//           IsRegistered: "No",
//           ProductCode: "PRO-26"
//         }
//       };

//       console.log('📤 International Rate Request:', JSON.stringify(requestBody, null, 2));

//       const response = await axios.post(
//         `${API_BASE_URL}/ratecalculator/rest/CalculatePriceRate`,
//         requestBody,
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'AccountNo': ACCOUNT_NO,
//             'Password': PASSWORD
//           }
//         }
//       );

//       console.log('📥 International Rate Response:', JSON.stringify(response.data, null, 2));

//       if (response.data && response.data.RateCalculationResponse) {
//         const rateData = response.data.RateCalculationResponse;
        
//         return {
//           price: parseFloat(rateData.TotalRate || rateData.BaseRate || 0),
//           serviceName: `International Shipping to ${destinationCountry}`,
//           serviceCode: `INT_${destinationCountry}`,
//           description: `Premium international shipping`,
//           details: rateData
//         };
//       }

//       return null;
//     } catch (error) {
//       console.error('❌ Error calculating international rate:', error.message);
//       if (error.response) {
//         console.error('Response data:', error.response.data);
//       }
//       return null;
//     }
//   }

//   // حساب سعر الشحن المحلي
//   async calculateDomesticRate(data) {
//     const {
//       originCity,
//       destinationCity,
//       weight,
//       length,
//       width,
//       height
//     } = data;

//     try {
//       const requestBody = {
//         RateCalculationRequest: {
//           ShipmentType: "Express",
//           ServiceType: "Domestic",
//           ContentTypeCode: "NonDocument",
//           OriginState: null,
//           OriginCity: originCity.toString(),
//           DestinationCountry: "971",
//           DestinationState: null,
//           DestinationCity: destinationCity.toString(),
//           Height: Math.ceil(height),
//           Width: Math.ceil(width),
//           Length: Math.ceil(length),
//           DimensionUnit: "Centimetre",
//           Weight: Math.ceil(weight).toString(),
//           WeightUnit: "Grams",
//           CalculationCurrencyCode: "AED",
//           IsRegistered: "No",
//           ProductCode: "EPG-21"
//         }
//       };

//       console.log('📤 Domestic Rate Request:', JSON.stringify(requestBody, null, 2));

//       const response = await axios.post(
//         `${API_BASE_URL}/ratecalculator/rest/CalculatePriceRate`,
//         requestBody,
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'AccountNo': ACCOUNT_NO,
//             'Password': PASSWORD
//           }
//         }
//       );

//       console.log('📥 Domestic Rate Response:', JSON.stringify(response.data, null, 2));

//       if (response.data && response.data.RateCalculationResponse) {
//         const rateData = response.data.RateCalculationResponse;
        
//         return {
//           price: parseFloat(rateData.TotalRate || rateData.BaseRate || 0),
//           serviceName: 'Domestic Shipping (UAE)',
//           serviceCode: 'DOM_UAE',
//           description: 'Express domestic shipping within UAE',
//           details: rateData
//         };
//       }

//       return null;
//     } catch (error) {
//       console.error('❌ Error calculating domestic rate:', error.message);
//       if (error.response) {
//         console.error('Response data:', error.response.data);
//       }
//       return null;
//     }
//   }
// }

// module.exports = new EmiratesPostService();


const axios = require('axios');

const API_BASE_URL = process.env.EMIRATES_POST_API_URL;
const ACCOUNT_NO = process.env.EMIRATES_POST_ACCOUNT_NO;
const PASSWORD = process.env.EMIRATES_POST_PASSWORD;

// كاش للدول والإمارات لتقليل الطلبات
let countriesCache = null;
let emiratesCache = null;

class EmiratesPostService {
  
  // جلب قائمة الدول
  async getCountries() {
    if (countriesCache) {
      return countriesCache;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/lookups/rest/GetCountries`);
      
      if (response.data && response.data.CountriesResponse && response.data.CountriesResponse.Countries) {
        countriesCache = response.data.CountriesResponse.Countries.Country || [];
        return countriesCache;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error fetching countries:', error.message);
      return [];
    }
  }

  // جلب قائمة الإمارات
  async getEmirates() {
    if (emiratesCache) {
      return emiratesCache;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/lookups/rest/GetEmiratesDetails`);
      
      if (response.data && response.data.GetEmiratesDetailsResult && response.data.GetEmiratesDetailsResult.EmirateBO) {
        emiratesCache = response.data.GetEmiratesDetailsResult.EmirateBO;
        return emiratesCache;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error fetching emirates:', error.message);
      return [];
    }
  }

  // الحصول على معرف الدولة من كود الدولة
  async getCountryIdByCode(countryCode) {
    const countries = await this.getCountries();
    const country = countries.find(c => c.CountryCode === countryCode);
    
    console.log(`🔍 Looking for country: ${countryCode}`);
    console.log(`✅ Found country:`, country);
    
    return country ? country.CountryId : null;
  }

  // الحصول على معرف المدينة من اسم المدينة
  getCityIdFromName(cityName) {
    // خريطة تقريبية للمدن الرئيسية في الإمارات
    const cityMap = {
      'dubai': '3',
      'abu dhabi': '2',
      'sharjah': '5',
      'ajman': '4',
      'ras al khaimah': '6',
      'fujairah': '7',
      'umm al quwain': '8'
    };

    if (!cityName) return '3'; // Dubai كقيمة افتراضية
    
    const normalizedCity = cityName.toLowerCase().trim();
    return cityMap[normalizedCity] || '3';
  }

  // حساب سعر الشحن الدولي - STANDARD (تم تعديله)
  async calculateInternationalRate(data) {
    const {
      destinationCountry,
      destinationCity,
      weight,
      length,
      width,
      height
    } = data;

    try {
      // الحصول على معرف الدولة
      const countryId = await this.getCountryIdByCode(destinationCountry);
      
      if (!countryId) {
        console.log(`⚠️ Country ${destinationCountry} not found in Emirates Post system`);
        return null;
      }

      // ✅ تم التغيير من Premium إلى Standard
      const requestBody = {
        RateCalculationRequest: {
          ShipmentType: "Standard",  // ✅ تغيير من Premium
          ServiceType: "International",
          OriginState: "",
          OriginCity: parseInt(process.env.DEFAULT_ORIGIN_CITY || '3'),
          DestinationCountry: parseInt(countryId),
          DestinationState: "",
          DestinationCity: destinationCity || "",
          Length: Math.ceil(length),
          Width: Math.ceil(width),
          Height: Math.ceil(height),
          Weight: Math.ceil(weight),
          CalculationCurrencyCode: "AED",
          ContentTypeCode: "NonDocument",
          DimensionUnit: "Centimetre",
          WeightUnit: "Grams",
          IsRegistered: "No",
          ProductCode: "PRO-712"  // ✅ تغيير من PRO-26 (Standard Service Code)
        }
      };

      console.log('📤 International Rate Request:');
      console.log(JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        `${API_BASE_URL}/ratecalculator/rest/CalculatePriceRate`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'AccountNo': ACCOUNT_NO,
            'Password': PASSWORD
          }
        }
      );

      console.log('📥 International Rate Response:');
      console.log(JSON.stringify(response.data, null, 2));

      if (response.data && response.data.RateCalculationResponse) {
        const rateData = response.data.RateCalculationResponse;
        
        // ✅ تحسين استخراج السعر
        const baseRate = parseFloat(rateData.BaseRate || 0);
        const totalRate = parseFloat(rateData.TotalRate || 0);
        const finalPrice = totalRate > 0 ? totalRate : baseRate;
        
        console.log(`💰 Price Details:`);
        console.log(`   Base Rate: ${baseRate} AED`);
        console.log(`   Total Rate: ${totalRate} AED`);
        console.log(`   Final Price: ${finalPrice} AED`);
        
        return {
          price: finalPrice,
          serviceName: `International Standard Shipping`,  // ✅ تغيير الاسم
          serviceCode: `INT_STD_${destinationCountry}`,
          description: `Standard international shipping to ${destinationCountry}`,
          details: rateData
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error calculating international rate:', error.message);
      if (error.response) {
        console.error('📛 Response Status:', error.response.status);
        console.error('📛 Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      return null;
    }
  }

  // حساب سعر الشحن المحلي
  async calculateDomesticRate(data) {
    const {
      originCity,
      destinationCity,
      weight,
      length,
      width,
      height
    } = data;

    try {
      const requestBody = {
        RateCalculationRequest: {
          ShipmentType: "Express",
          ServiceType: "Domestic",
          ContentTypeCode: "NonDocument",
          OriginState: null,
          OriginCity: originCity.toString(),
          DestinationCountry: "971",
          DestinationState: null,
          DestinationCity: destinationCity.toString(),
          Height: Math.ceil(height),
          Width: Math.ceil(width),
          Length: Math.ceil(length),
          DimensionUnit: "Centimetre",
          Weight: Math.ceil(weight).toString(),
          WeightUnit: "Grams",
          CalculationCurrencyCode: "AED",
          IsRegistered: "No",
          ProductCode: "EPG-21"
        }
      };

      console.log('📤 Domestic Rate Request:');
      console.log(JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        `${API_BASE_URL}/ratecalculator/rest/CalculatePriceRate`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'AccountNo': ACCOUNT_NO,
            'Password': PASSWORD
          }
        }
      );

      console.log('📥 Domestic Rate Response:');
      console.log(JSON.stringify(response.data, null, 2));

      if (response.data && response.data.RateCalculationResponse) {
        const rateData = response.data.RateCalculationResponse;
        
        const baseRate = parseFloat(rateData.BaseRate || 0);
        const totalRate = parseFloat(rateData.TotalRate || 0);
        const finalPrice = totalRate > 0 ? totalRate : baseRate;
        
        console.log(`💰 Price Details:`);
        console.log(`   Base Rate: ${baseRate} AED`);
        console.log(`   Total Rate: ${totalRate} AED`);
        console.log(`   Final Price: ${finalPrice} AED`);
        
        return {
          price: finalPrice,
          serviceName: 'Domestic Express Shipping (UAE)',
          serviceCode: 'DOM_UAE',
          description: 'Express domestic shipping within UAE',
          details: rateData
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error calculating domestic rate:', error.message);
      if (error.response) {
        console.error('📛 Response Status:', error.response.status);
        console.error('📛 Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      return null;
    }
  }
}

module.exports = new EmiratesPostService();