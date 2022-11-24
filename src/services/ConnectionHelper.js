import NetInfo from '@react-native-community/netinfo';

const connectionHelper = {
  async validateConnection() {
    let isConnected = false;
    
    await NetInfo.isConnected
      .fetch()
      .then(response => {
        if (response) {
          isConnected = true;
        }
      })
      .catch(error => {
        isConnected = false;
      })

    return isConnected;
  },
}

export default connectionHelper;