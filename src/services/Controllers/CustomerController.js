import toastWrapper from "../ToastWrapper";
import { breakLineText } from "../../utils";
import masterApi from "../MasterApi";

const customerController = {
  async sendCustomerAsync(customer) {
    return new Promise(async (resolve, reject) => {
      await masterApi.putCustomerAsync(customer)
        .then((response) => {
          if (response.data && response.data.Model) {
            const codigoCliente = response.data && response.data.Model && response.data.Model.Codigo;
            customer.Codigo = codigoCliente;
            customer.Sincronizado = true;
          }

          resolve(customer);
        })
        .catch((error) => {
          let errors = error && error.data && error.data.Erros && error.data.Erros
            .map(e => e.Mensagem)
            .splice(0, 1);

          if (errors && errors.length) {
            toastWrapper.showToast(breakLineText(errors));
          }
          else {
            toastWrapper.showToast('Ocorreu um erro ao enviar o cliente.');
          }

          reject(error);
        });
    });
  }
}

export default customerController;