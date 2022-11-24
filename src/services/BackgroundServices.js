import BackgroundTimer from 'react-native-background-timer';
import firestoreWrapper from './FirestoreWrapper';
import firebase from "react-native-firebase";
import localStorage from "./LocalStorage";
import dataStorage from "./DataStorage";
import masterApi from "./MasterApi";
import { genUUID } from '../utils';

const backgroundServices = {
  async stopAllServicesAsync() {
    await BackgroundTimer.stopBackgroundTimer();
  },

  async handleProductsSyncFromMasterApiAsync() {
    await localStorage.setValueAsync('app.productSyncActive', '1');
    await localStorage.setValueAsync('app.productSyncFailed', '0');

    await BackgroundTimer.setTimeout(async () => {
      await masterApi.getTodosProdutosAsync()
        .then(async produtosApi => {

          if (produtosApi && produtosApi.length) {
            await dataStorage.setStoredProductsAsync(produtosApi);         
          }

          const syncFinishedNotification = new firebase.notifications.Notification()
            .setNotificationId('app.productSyncActive')
            .setTitle('Sincronização de produtos finalizada')
            .setBody('Você já pode utilizar o app. :)')
            .android.setPriority(firebase.notifications.Android.Priority.Max)
            .android.setChannelId('sync-produtos');

          await firebase.notifications()
            .displayNotification(syncFinishedNotification);

        })
        .catch(async error => {
          await localStorage.setValueAsync('app.productSyncFailed', '1');
        });
    }, 2000);

    await localStorage.setValueAsync('app.productSyncActive', '0');
  },

  // async handleImagesSyncFromMasterApiAsync() {
  
  //   BackgroundTimer.setTimeout(async () => {
  //     await masterApi.getImagens()

  //     const syncFinishedNotification = new firebase.notifications.Notification()
  //           .setNotificationId('app.imagesSyncActive')
  //           .setTitle('Sincronização de imagens finalizada')
  //           .setBody('Pode vê-las na venda ou no produto :)')
  //           .android.setPriority(firebase.notifications.Android.Priority.Max)
  //           .android.setChannelId('sync-imagens');    
  //     await firebase.notifications()
  //       .displayNotification(syncFinishedNotification);
  //   }, 2000)
  // },

  async handleCustomersSyncFromMasterApiAsync() {
    await localStorage.setValueAsync('app.customerSyncActive', '1');
    await localStorage.setValueAsync('app.customerSyncFailed', '0');

    await BackgroundTimer.setTimeout(async () => {
      const customers = await firestoreWrapper.getCustomersAsync() || [];
      const delayAfterSync = 5000;

      await masterApi.getTodosClientesAsync()
        .then(async customersApi => {
          if (customersApi.length) {
            await customersApi.forEach(async customerApi => {
              customerApi = {
                ...customerApi,
                Sincronizado: true,
                uuid: genUUID(),
              };

              let customerIndex = customers.findIndex(c => c.Codigo === customerApi.Codigo);

              if (customerIndex != -1) {
                customers[customerIndex] = customerApi;
              }
              else {
                //await firestoreWrapper.postCustomerAsync(customerApi);
                customers.push(customerApi);
              }
            })
          }

          if (customers && customers.length) {
            await dataStorage.setStoredCustomersAsync(customers);
          }

          await setTimeout(async () => {
            await localStorage.setValueAsync('app.customerSyncActive', '0');

            const syncFinishedNotification = new firebase.notifications.Notification()
              .setNotificationId('app.clientesApi')
              .setTitle('Sincronização de clientes finalizada')
              .setBody('Você já pode utilizar os clientes do seu ERP. :)')
              .android.setPriority(firebase.notifications.Android.Priority.Max)
              .android.setChannelId('sync-clientes');

            await firebase.notifications()
              .displayNotification(syncFinishedNotification);
          }, delayAfterSync);
        })
        .catch(async error => {
          await setTimeout(async () => {
            await localStorage.setValueAsync('app.customerSyncActive', '0');
            await localStorage.setValueAsync('app.customerSyncFailed', '1');
          }, delayAfterSync);
        });
    }, 3000);
  },
}

export default backgroundServices;