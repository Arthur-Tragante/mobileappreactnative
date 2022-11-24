import AsyncStorage from '@react-native-community/async-storage';

const localStorage = {
  async getValueAsync(name) {
    if (name) {
      try {
        let valueName = name.toString();
        if (!valueName.startsWith('@')) {
          valueName = `@${valueName}`;
        }

        let jsonValue = await AsyncStorage.getItem(valueName)
        return JSON.parse(jsonValue);
      } catch (e) {
        if (__DEV__) {
          alert(`localStorage.getValueAsync error: ${e}`);
        }
      }
    }
  },

  async setValueAsync(name, value) {
    if (name && value) {
      try {
        let valueName = name.toString();
        if (!valueName.startsWith('@')) {
          valueName = `@${valueName}`;
        }

        return await AsyncStorage.setItem(valueName, JSON.stringify(value));
      } catch (e) {
        if (__DEV__) {
          alert(`localStorage.setValueAsync error: ${e}`);
        }
      }
    }
  },

  async removeItemAsync(name) {
    if (name) {
      try {
        let valueName = name.toString();
        if (!valueName.startsWith('@')) {
          valueName = `@${valueName}`;
        }

        return await AsyncStorage.removeItem(valueName);
      } catch (e) {
        if (__DEV__) {
          alert(`localStorage.removeItemAsync error: ${e}`);
        }
      }
    }
  },

  async clearStorageAsync() {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      if (__DEV__) {
        alert(`localStorage.clearStorageAsync error: ${e}`);
      }
    }
  },
}

export default localStorage;