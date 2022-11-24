import { Vibration } from 'react-native';
import { Toast } from "native-base";

const toastWrapper = {
  showToast(text, duration = 3000, vibrate = true) {
    if (vibrate === true) {
      // Vibration.vibrate(200);
    }

    Toast.show({
      duration: duration,
      buttonText: 'Ok',
      text: text,
    });
  }
}

export default toastWrapper;