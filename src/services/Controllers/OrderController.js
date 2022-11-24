import toastWrapper from "../ToastWrapper";
import { breakLineText } from "../../utils";
import masterApi from "../MasterApi";

const orderController = {
  async sendOrderAsync(order) {
    return new Promise(async (resolve, reject) => {
      await masterApi.putOrderAsync(order)
        .then((response) => {
          if (response.data && response.data.Model) {
            const responseOrder = response.data.Model;
            const orderItems = responseOrder.Itens;

            orderItems.forEach(item => {
              let orderItem = order.Itens.find(i => i.ProdutoCodigo == item.ProdutoCodigo);

              if (orderItem) {
                orderItem.Codigo = item.Codigo;
              }
            });

            if (responseOrder.Parcelas && responseOrder.Parcelas.length) {
              responseOrder.Parcelas.forEach((item) => {
                let orderParcel = order.Parcelas.find(i => i.Numero == item.Numero);

                if (orderParcel) {
                  orderParcel.Codigo = item.Codigo;
                }
              });
            }

            order.Codigo = responseOrder.Codigo;
            order.Sincronizado = true;
          }

          resolve(order);
        })
        .catch((error) => {
          let errors = error && error.data && error.data.Erros && error.data.Erros
            .map(e => e.Mensagem)
            .splice(0, 1);

          if (errors && errors.length) {
            toastWrapper.showToast(breakLineText(errors));
          }
          else {
            toastWrapper.showToast('Ocorreu um erro ao enviar a venda.');
          }

          reject(error);
        });
    });
  }
}

export default orderController;