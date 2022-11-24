import connectionHelper from './ConnectionHelper';
import firebase from 'react-native-firebase';
import localStorage from './LocalStorage';

const firestoreWrapperHelper = {
  sources: {
    default: 'default',
    server: 'server',
    cache: 'cache',
  },

  async handleGetData(path, name, source = this.sources.default) {
    if (!firestoreWrapper.isLoggedIn()) {
      return [];
    }

    let dataArray = [];

    const options = {
      source: source || this.sources.default,
    }

    await path
      .get(options)
      .then(async snapshot => {
        if (snapshot) {
          snapshot.forEach(doc => {
            dataArray.push(doc.data());
          })
        }
      })
      .catch(async error => {
        await firestoreWrapper.saveErrorAsync(`firestore_get_${name}`, error);
      });

    return dataArray || [];
  },

  async handlePostData(path, name, data, merge = true) {
    if (!firestoreWrapper.isLoggedIn()) {
      return false;
    }

    let success = false;

    await path
      .set(data, {
        merge: merge === true
      })
      .then(() => {
        success = true;
      })
      .catch(async error => {
        await firestoreWrapper.saveErrorAsync(`firestore_post_${name}`, error);
      });

    return success;
  },

  async handlePostBatchData(batch, name) {
    if (!firestoreWrapper.isLoggedIn()) {
      return false;
    }

    let success = false;

    await batch.commit()
      .then(() => {
        success = true;
      })
      .catch(async error => {
        if (name != 'errors') {
          await firestoreWrapper.saveErrorAsync(`firestore_post_batch_${name}`, error);
        }
      });

    return success;
  },

  async handleUpdateArrayData(path, name, data) {
    if (!firestoreWrapper.isLoggedIn()) {
      return false;
    }

    let success = false;

    await path
      .update({
        errors: firebase.firestore.FieldValue.arrayUnion(data)
      })
      .then(() => {
        success = true;
      })
      .catch(async error => {
        if (name != 'errors') {
          await firestoreWrapper.saveErrorAsync(`firestore_update_array_${name}`, error);
        }
      });

    return success;
  },

  async handleCreateDocumentIfNotExists(path, data) {
    if (!firestoreWrapper.isLoggedIn()) {
      return false;
    }

    let success = false;

    await path
      .get()
      .then(async snapshot => {
        if (!snapshot.data()) {
          await path
            .set(data)
            .then(() => {
              success = true;
            });
        }
      })
      .catch(async error => {
        await firestoreWrapper.saveErrorAsync(`firestore_create_document_${name}`, error);
      });

    return success;
  },

  buildFirestoreInstance() {
    return new Promise(async (resolve, reject) => {
      const isConnected = await connectionHelper.validateConnection();
      let firestore = firebase.firestore();

      if (isConnected) {
        await firestore.enableNetwork()
          .then(() => {
            resolve(firestore, isConnected);
          })
          .catch(() => {
            reject(firestore, isConnected);
          })
      }
      else {
        await firestore.disableNetwork()
          .then(() => {
            resolve(firestore, isConnected);
          })
          .catch(() => {
            reject(firestore, isConnected);
          })
      }
    })
  }
}

const firestoreWrapper = {
  async saveErrorAsync(type, error, saveToUserPathIfAuthenticated = true) {
    try {
      error = error || {};

      const userId = await localStorage.getValueAsync('user.id');
      const details = error.toString();

      let errorDetails = {
        masterApiEndpoint: await localStorage.getValueAsync('master.api.endpoint'),
        masterApiToken: await localStorage.getValueAsync('master.api.token'),
        userEmail: await localStorage.getValueAsync('user.email'),
        userName: await localStorage.getValueAsync('user.name'),
        dateTime: new Date(),
        exception: error,
        userId: userId,
      }

      if (details && details != '[object Object]') {
        errorDetails.details = details;
      }

      if (userId && saveToUserPathIfAuthenticated) {
        await firestoreWrapperHelper.buildFirestoreInstance()
          .then(async (firestore, isConnected) => {
            let path = firestore
              .collection('users')
              .doc(userId)
              .collection('errors')
              .doc(type.replace('/', '_'))
              .collection('errors')
              .doc(new Date().toString());

            if (isConnected) {
              await firestoreWrapperHelper.handlePostData(path, 'errors', errorDetails);
            }
            else {
              firestoreWrapperHelper.handlePostData(path, 'errors', errorDetails);
            }
          })
      }
      else {
        await firestoreWrapperHelper.buildFirestoreInstance()
          .then(async (firestore, isConnected) => {
            let path = firestore
              .collection('errors')
              .doc(type.replace('/', '_'))
              .collection('errors')
              .doc(new Date().toString());

            if (isConnected) {
              await firestoreWrapperHelper.handlePostData(path, 'errors', errorDetails);
            }
            else {
              firestoreWrapperHelper.handlePostData(path, 'errors', errorDetails);
            }
          })
      }
    }
    catch (error) {
      if (__DEV__) {
        alert(`firestoreWrapper.saveErrorAsync: ${error}`);
      }
    }
  },

  isLoggedIn() {
    return firebase.auth().currentUser && firebase.auth().currentUser.uid;
  },

  async getDeviceIdAsync() {
    const userId = await localStorage.getValueAsync('user.id');
    let deviceId = null;

    await firestoreWrapperHelper.buildFirestoreInstance()
      .then(async (firestore, isConnected) => {
        await firestore
          .collection('users')
          .doc(userId)
          .get()
          .then(async snapshot => {
            let userData = snapshot.data();
            deviceId = userData && userData.deviceId;
          })
      });

    return deviceId;
  },

  async getSettingsAsync() {
    const userId = await localStorage.getValueAsync('user.id');
    let settings = {};

    await firestoreWrapperHelper.buildFirestoreInstance()
      .then(async (firestore, isConnected) => {
        let path = firestore
          .collection('users')
          .doc(userId)
          .collection('settings')
          .doc('config');

          settings = await firestoreWrapperHelper.handleGetData(path, 'settings');
        });

    return settings || {};
  },

  async getCustomersAsync() {
    const userId = await localStorage.getValueAsync('user.id');
    let customers = [];

    await firestoreWrapperHelper.buildFirestoreInstance()
      .then(async (firestore, isConnected) => {
        let path = firestore
          .collection('users')
          .doc(userId)
          .collection('customers');

        customers = await firestoreWrapperHelper.handleGetData(path, 'customers');
      });

    return customers || [];
  },

  async getOrdersAsync() {
    const userId = await localStorage.getValueAsync('user.id');
    let orders = [];
    // console.log('buscando vendas no firebase');
    await firestoreWrapperHelper.buildFirestoreInstance()
      .then(async (firestore, isConnected) => {
        let path = firestore
          .collection('users')
          .doc(userId)
          .collection('orders');

        orders = await firestoreWrapperHelper.handleGetData(path, 'orders');
        // orders.map(i => console.log(i.Codigo));
      });

    return orders || [];
  },

  async getProductsAsync() {
    const userId = await localStorage.getValueAsync('user.id');
    let products = [];

    await firestoreWrapperHelper.buildFirestoreInstance()
      .then(async (firestore, isConnected) => {
        let path = firestore
          .collection('users')
          .doc(userId)
          .collection('products');

        products = await firestoreWrapperHelper.handleGetData(path, 'products');
      });

    return products || [];
  },

  async postSettingsAsync(settings) {

    if (!settings) {
      return;
    }

    const userId = await localStorage.getValueAsync('user.id');

    await firestoreWrapperHelper.buildFirestoreInstance()
      .then(async (firestore,isConnected) => {
        const path = firestore
          .collection('users')
          .doc(userId)
          .collection('settings')
          .doc('config')
        if (isConnected) {
          await firestoreWrapperHelper.handlePostData(path, 'settings', settings);
        } else {
          firestoreWrapperHelper.handlePostData(path, 'settings', settings);
        }
      });
  },

  async postCustomerAsync(customer) {
    if (!customer || !customer.uuid) {
      return;
    }

    const userId = await localStorage.getValueAsync('user.id');

    await firestoreWrapperHelper.buildFirestoreInstance()
      .then(async (firestore, isConnected) => {
        const path = firestore
          .collection('users')
          .doc(userId)
          .collection('customers')
          .doc(customer.uuid);

        if (isConnected) {
          await firestoreWrapperHelper.handlePostData(path, 'customer', customer);
        }
        else {
          firestoreWrapperHelper.handlePostData(path, 'customer', customer);
        }
      })
  },

  async postOrderAsync(order) {
    if (!order || !order.uuid) {
      return;
    }

    const userId = await localStorage.getValueAsync('user.id');

    await firestoreWrapperHelper.buildFirestoreInstance()
      .then(async (firestore, isConnected) => {
        const path = firestore
          .collection('users')
          .doc(userId)
          .collection('orders')
          .doc(order.uuid);

        if (isConnected) {
          await firestoreWrapperHelper.handlePostData(path, 'order', order);
        }
        else {
          firestoreWrapperHelper.handlePostData(path, 'order', order);
        }
      })
  },

  async postProductAsync(product) {
    if (!product || !product.Codigo) {
      return;
    }

    const userId = await localStorage.getValueAsync('user.id');

    await firestoreWrapperHelper.buildFirestoreInstance()
      .then(async (firestore, isConnected) => {
        const path = firestore
          .collection('users')
          .doc(userId)
          .collection('products')
          .doc(product.Codigo.toString());

        if (isConnected) {
          await firestoreWrapperHelper.handlePostData(path, 'product', product);
        }
        else {
          firestoreWrapperHelper.handlePostData(path, 'product', product);
        }
      })
  },

  async postProductBatchAsync(products) {
    if (!products || !Array.isArray(products)) {
      return;
    }

    await firestoreWrapperHelper.buildFirestoreInstance()
      .then(async (firestore, isConnected) => {
        let batch = firestore.batch();

        await products.forEach(async product => {
          if (!product.Codigo) {
            return;
          }

          var productRef = firestore
            .collection("users")
            .doc(userId)
            .collection('products')
            .doc(product.Codigo.toString());

          await batch.set(productRef, product, {
            merge: true
          });
        });

        await firestoreWrapperHelper.handlePostBatchData(batch, 'products');
      });
  },

  async deleteCustomerAsync(customer) {
    let success = false;

    if (customer && customer.uuid) {
      const userId = await localStorage.getValueAsync('user.id');

      await firestoreWrapperHelper.buildFirestoreInstance()
        .then(async (firestore, isConnected) => {
          await firestore
            .collection('users')
            .doc(userId)
            .collection('customers')
            .doc(customer.uuid)
            .delete();
        });
    }

    return success;
  },

  async deleteOrderAsync(order) {
    let success = false;

    if (order && order.uuid) {
      const userId = await localStorage.getValueAsync('user.id');

      await firestoreWrapperHelper.buildFirestoreInstance()
        .then(async (firestore, isConnected) => {
          await firestore
            .collection('users')
            .doc(userId)
            .collection('orders')
            .doc(order.uuid)
            .delete();
        });
    }

    return success;
  },
}

export default firestoreWrapper;