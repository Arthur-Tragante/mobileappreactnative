import firebase from "react-native-firebase";
import { Platform } from 'react-native';

const androidNotificationChannelsServices = {
  appNotificationChannels: [
    {
      id: 'sync-produtos',
      name: 'Sincronização de produtos',
      description: 'Sincronização inicial de produtos.',
    },
    {
      id: 'sync-clientes',
      name: 'Sincronização de clientes',
      description: 'Sincronização inicial de clientes.',
    },
    {
      id: 'sync-imagens',
      name: 'Sincronização de imagens',
      description: 'Sincronização de todas as imagens.',
    },    
  ],

  configureAppNotificationChannels() {
    if (Platform.OS == 'android') {
      this.appNotificationChannels.forEach(channel => {
        const notificationChannelSyncProdutos = new firebase
          .notifications
          .Android
          .Channel(channel.id, channel.name, firebase.notifications.Android.Importance.Max)
          .setDescription(channel.description);

        firebase.notifications()
          .android
          .createChannel(notificationChannelSyncProdutos);
      });
    }
  }
}

export default androidNotificationChannelsServices;