import localStorage from "./LocalStorage";

const dataStorage = {

  async setStoredImagesAsync(imagem, codigo) {
    if (imagem) {
      await localStorage.setValueAsync(`data.image${codigo}`, imagem) || {};
    }
  },

  async getStoredImagesAsync(codigo) {
    let imagem = ''
    if (codigo) {
      imagem = await localStorage.getValueAsync(`data.image${codigo}`) || {};
    }
    console.log(imagem)
    return imagem
  },

  async setStoredSettingsAsync(settings) {
    if (settings) {
      await localStorage.setValueAsync('data.settings', settings);
    }
  },

  async getStoredSettingsAsync() {
    let storedSettings = await localStorage.getValueAsync('data.settings') || {};

    return storedSettings;
  },  

  async VerificaConfiguracao(setting) {
    let storedSetting = await localStorage.getValueAsync('data.settings');
    return storedSetting[setting];
  },

  async setStoredOrdersAsync(orders) {
    if (orders && orders.length) {
      await localStorage.setValueAsync('data.orders', orders);
    }
  },

  async getStoredOrdersAsync() {
    let storedOrders = await localStorage.getValueAsync('data.orders') || [];
    let orders = [];

    storedOrders.forEach(order => {
      orders.push(order);
    });

    return orders;
  },

  async setStoredProductsAsync(products) {
    if (products && products.length) {
      let productsGroupLength = products.length % 500 == 0 ? products.length/500|0 : (products.length/500 + 1)|0;
      
      await localStorage.setValueAsync('data.productsGroupLength', productsGroupLength);
      
      for (let i = 0; i < productsGroupLength; i++) {
        await localStorage.setValueAsync(`data.products${i}`, products.slice(i*500, (i+1)*500));
      }

    }
  },

  async getStoredProductsAsync() {
    let products = [];

    await localStorage.getValueAsync('data.productsGroupLength').then(async productsGroupLength => {
      for (let i = 0; i < productsGroupLength; i++) 
        await localStorage.getValueAsync(`data.products${i}`).then(dataProducts => {
          dataProducts.forEach(product => products.push(product));
        });
    });    

    return products;
  },

  async setStoredCustomersAsync(customers) {
    if (customers && customers.length) {
      let customersGroupLength = customers.length % 500 == 0 ? customers.length/500|0 : (customers.length/500 + 1)|0;
      
      await localStorage.setValueAsync('data.customersGroupLength', customersGroupLength);

      for (let i = 0; i < customersGroupLength; i++) {
        await localStorage.setValueAsync(`data.customers${i}`, customers.slice(i*500, (i+1)*500));
      }

    }
  },

  async getStoredCustomersAsync() {
    let customers = [];

    await localStorage.getValueAsync('data.customersGroupLength').then(async customersGroupLength => {
      for (let i = 0; i < customersGroupLength; i++) 
        await localStorage.getValueAsync(`data.customers${i}`).then(dataCustomers => {
          if (dataCustomers === null) {
            console.log('sem clientes')
          } else{
            dataCustomers.forEach(customer => customers.push(customer));
          }
        });
    });

    return customers;
  }
}

export default dataStorage;