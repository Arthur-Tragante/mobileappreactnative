import connectionHelper from './ConnectionHelper';
import firestoreWrapper from './FirestoreWrapper';
import localStorage from './LocalStorage';
import axios from 'axios';
import { isFunction } from '../utils';
import dataStorage from './DataStorage';
import toastWrapper from './ToastWrapper';

const masterApiHelper = {
  filterDataClientes: {
    Codigo: {
      Filtro: {
        Operator: ">"
      },
      Valores: [0]
    }
  },

  filterDataVendas: {
    Codigo: {
      Filtro: {
        Operator: ">"
      },
      Valores: [0]
    }
  },

  async sendRequest(func, method, data, headers) {
    let endpoint = await localStorage.getValueAsync('master.api.endpoint');
    const token = await localStorage.getValueAsync('master.api.token');
    let response;

    if (endpoint.endsWith('/')) {
      endpoint = endpoint.substring(0, endpoint.length - 1);
    }

    let requestHeaders = {
      'Content-Type': 'application/json',
      'X-Token': token,
      'X-Controller': 'false',
    };

    if (headers && Array.isArray(headers)) {
      headers.forEach(header => {
        requestHeaders[header.name] = header.value;
      });
    }
    console.log(endpoint, func, requestHeaders, method);   
    await axios({
      baseURL: `${endpoint}/${func}`,
      headers: requestHeaders,
      timeout: 10000,
      method: method,
      data: data,
    }).then(r => {
      console.log(r);
      response = r;
    }).catch(r => {
      throw r;
    })
    return response;
  },

  buildPromise(func, method, data, headers) {
    return new Promise(async (resolve, reject) => {
      const isConnected = await connectionHelper.validateConnection();
      if (!isConnected) {
        reject('Device is offline.');
      }
      
      try {
        const response = await this.sendRequest(func, method, data, headers);

        if (method != 'get' && (!response || !response.data || response.data.status !== true)) {
          throw response;
        }

        resolve(response);
      }
      catch (error) {
        await firestoreWrapper.saveErrorAsync(`master_api_${method}_${func}`, error);
        reject(error);
      }
    })
  },
}

const masterApi = {
  async pingAsync() {
    return masterApiHelper.buildPromise('Ping', 'get');
  },

  async getPrecosFilaAsync(storedProducts) {
    toastWrapper.showToast('Sincronizando preços...');
    let shouldBreak = false;
    let hasErrors = false;
    let errorCount = 0;
    let count = 0;
    while (!shouldBreak) {
      await masterApiHelper.buildPromise(
        'PrecoSimples/ok',
        'get',
        null,
        [
          {
            name: 'limit',
            value: 100
          },
        ]
      ).then(async response => {
        const responseData = response.data && response.data.preco || [];

        if (responseData && responseData.length > 0) {
          count += responseData.length;
          responseData.forEach(preco => {
            try {
              let storedProductIndex = storedProducts.findIndex(
                p => p.Codigo === preco.Codigo
              );  
              if (storedProductIndex != -1) {
                storedProducts[storedProductIndex].Custo = preco.Custo;
                storedProducts[storedProductIndex].PrecoVenda = preco.PrecoVenda;
                storedProducts[storedProductIndex].PrecoFicticio = preco.PrecoFicticio;
                storedProducts[storedProductIndex].PermiteDesconto = preco.PermiteDesconto;
                storedProducts[storedProductIndex].DescontoMaximo = preco.DescontoMaximo;
              }
            } catch {
              console.log('catch')
              hasErrors = true;
            }
          });
          await dataStorage.setStoredProductsAsync(storedProducts);
        } else {
          console.log('retorno vazio')
          shouldBreak = true;
        }
      }).catch(error => {
        errorCount++;
        if (errorCount >= 5) {
          shouldBreak = true;
          hasErrors = true;
        }
      });
      toastWrapper.showToast('Sincronizando preços (' + count + ' de ' + storedProducts.length + ')');
    }
    return hasErrors;
  },

  async getEstoquesFilaAsync(storedProducts) {
    let shouldBreak = false;
    let errorCount = 0;
    let hasErrors = false;
    let productsCount = storedProducts.length;
    let countEstoqueSinc = 0;

    toastWrapper.showToast('Sincronizando estoques...');
    while (true) {
      if (shouldBreak) {
        break;
      }

      await masterApiHelper.buildPromise('Estoque/ok', 'get', null, [
        {
          name: 'limit',
          value: 100
        },
      ])
        .then( async response => {
          const estoquesResponse = response.data && response.data.estoque || [];

          if (estoquesResponse && estoquesResponse.length > 0) {
            countEstoqueSinc += estoquesResponse.length;
            estoquesResponse.forEach(estoque => {
              try {
                let storedProductIndex = storedProducts.findIndex(
                  p => p.Codigo === estoque.Codigo
                );  
                if (storedProductIndex != -1) {
                  if (estoque.EstoqueAtual > 0) 
                    storedProducts[storedProductIndex].EstoqueAtual = estoque.EstoqueAtual
                  else 
                    storedProducts[storedProductIndex].EstoqueAtual = estoque.Estoque
                }  
              } catch {
                hasErrors = true;
              }
            });

            await dataStorage.setStoredProductsAsync(storedProducts);
          }
          else {
            shouldBreak = true;
          }
        })
        .catch(error => {
          errorCount++;
          if (errorCount >= 5) {
            shouldBreak = true;
            hasErrors = true;
          }
        });
      toastWrapper.showToast('Sincronizando estoques ('+countEstoqueSinc+' de '+productsCount+')');
    }
    return hasErrors;
  },

  async getImagemAsync(codigoProduto = 0) {
    await masterApiHelper.buildPromise(`ImagemPrincipal${codigoProduto > 0 ? (`/${codigoProduto}`) : ''}`, 'get', null, [])
      .then(async response => {
        const ImagemResponse = response.data || []
        if (ImagemResponse) {
          await dataStorage.setStoredImagesAsync(ImagemResponse.Imagem, codigoProduto)
        }
        else {
          if (codigoProduto > 0) {
            await dataStorage.setStoredImagesAsync(' ', codigoProduto)  
          }
        }
      })
      .catch(error => {
        console.log(error);
      })
  },

  async getProdutosFilaAsync(storedProducts) {
    let shouldBreak = false;
    let errorCount = 0;
    let hasErrorsProducts = false;

    toastWrapper.showToast('Sincronizando produtos...');
    while (true) {
      if (shouldBreak) {
        break;
      }

      await masterApiHelper.buildPromise('ProdutoSimples/ok', 'get', null, [
        {
          name: 'limit',
          value: 100,
        },
      ])
        .then( async response => {
          const responseData = response.data && response.data.produto || [];

          if (responseData && responseData.length > 0) {
            responseData.forEach(produto => {
              try {
                let storedProductIndex = storedProducts.findIndex(
                  p => p.Codigo === produto.Codigo
                );
    
                if (storedProductIndex != -1) {
                  storedProducts[storedProductIndex] = produto;
                } else {
                  storedProducts.push(produto);
                }
              } catch {
                hasErrorsProducts = true;
              }        
            });

            await dataStorage.setStoredProductsAsync(storedProducts);
          }
          else {
            shouldBreak = true;
          }
        })
        .catch(error => {
          errorCount++;

          if (errorCount >= 5) {
            hasErrorsProducts = true;
            shouldBreak = true;
          }
        });
    }

    return hasErrorsProducts;
  },



  async getEstoquePorProdutoAsync(product) {
    return masterApiHelper.buildPromise(`estoque/${product}`, 'get');
  },


  async getTodosClientesAsync(callbackAfterRequest){
    let errorCount = 0, limit = 1000, offset = 0;
    let shouldBreak = false;
    let clientes = []; 
    
    while (true) {
      if (shouldBreak) {
        break;
      }

      await masterApiHelper.buildPromise('ClienteSimples', 'get', null, [
        {
          name: 'X-Queue',
          value: 'false',
        },
        {
          name: 'offset',
          value: offset,
        },
        {
          name: 'limit',
          value: limit,
        },
      ])
        .then(response => {
          const clientesResponse = response.data && response.data.cliente || [];

          if (clientesResponse && clientesResponse.length > 0) {
            clientesResponse.forEach(cliente => {
              clientes.push(cliente);
            });

            offset += limit;

            if (isFunction(callbackAfterRequest)) {
              callbackAfterRequest(clientesResponse);
            }
          }
          else {
            shouldBreak = true;
          }
        })
        .catch(error => {
          errorCount++;

          if (errorCount >= 5) {
            shouldBreak = true;
          }
        });
    }

    return clientes;
  },

  async getTodosProdutosAsync(callbackAfterRequest) {
    let errorCount = 0, limit = 1000, offset = 0;
    let shouldBreak = false;
    let produtos = [];

    while (true) {
      if (shouldBreak) {
        break;
      }

      await masterApiHelper.buildPromise('ProdutoSimples', 'get', null, [
        {
          name: 'X-Queue',
          value: 'false',
        },
        {
          name: 'offset',
          value: offset,
        },
        {
          name: 'limit',
          value: limit,
        },
      ])
        .then(response => {
          const produtosResponse = response.data && response.data.produto || [];

          if (produtosResponse && produtosResponse.length > 0) {
            produtosResponse.forEach(produto => {
              produtos.push(produto);
            });

            offset += limit;

            if (isFunction(callbackAfterRequest)) {
              callbackAfterRequest(produtosResponse);
            }
          }
          else {
            shouldBreak = true;
          }
        })
        .catch(error => {
          errorCount++;

          if (errorCount >= 5) {
            shouldBreak = true;
          }
        });
    }

    return produtos;
  },

  async getClienteAsync(parameter, argument) {
    let shouldBreak = false;
    let errorCount = 0;
    let clientes = [];

    while (true) {
      if (shouldBreak) {
        break;
      }

      await masterApiHelper.buildPromise('getclientes', 'post', {
        [parameter]: {
          Filtro: {
            Like: true
          },
          Valores: [
            argument
          ]
        }
      })
        .then(response => {
          const clientesResponse = response.data && response.data.cliente || [];

          if (clientesResponse && clientesResponse.length > 0) {
            clientesResponse.forEach(cliente => {
              clientes.push(cliente);
            });

            if (isFunction(callbackAfterRequest)) {
              callbackAfterRequest(clientesResponse);
            }
          }
          else {
            shouldBreak = true;
          }
        })
        .catch(error => {
          errorCount++;

          if (errorCount >= 5) {
            shouldBreak = true;
          }
        });
    }

    return clientes;
  },

  async getClientesFilaAsync(storedCustomers) {
    let shouldBreak = false;
    let errorCount = 0;
    let hasErrorsCustomers = false;

    toastWrapper.showToast('Sincronizando clientes...');
    while (true) {
      if (shouldBreak) {
        break;
      };

      await masterApiHelper.buildPromise('ClienteSimples/ok', 'get', null, [
        {
          name: 'limit',
          value: 2000,
        },
      ])
      .then(response => {
        const customerResponse = response.data && response.data.cliente || [];

        if (customerResponse && customerResponse.length > 0) {
          customerResponse.forEach(cliente => {
            try {
              let storedCustomerIndex = storedCustomers.findIndex(
                c => c.Codigo == cliente.Codigo
              );
  
              if (storedCustomerIndex != -1) {
                storedCustomers[storedCustomerIndex] = cliente;
              } else {
                storedCustomers.push(cliente);
              }
            } catch {
              hasErrorsCustomers = true;
            }        
          });
        }
        else {
          shouldBreak = true;
        }
      })
      .catch(error => {
        errorCount++;

        if (errorCount >= 5) {
          hasErrorsCustomers = true;
          shouldBreak = true;
        }
      });
    }

    return hasErrorsCustomers;
  },

  async getClientesAsync() {
    return masterApiHelper.buildPromise('GetClientes', 'post', masterApiHelper.filterDataClientes);
  },

  async getVendasAsync() {
    return masterApiHelper.buildPromise('GetVendas', 'post', masterApiHelper.filterDataVendas);
  },

  async getAcoesAsync() {
    let usuarioToken = await localStorage.getValueAsync('master.api.token');
    let acoes = await masterApiHelper.buildPromise(`GetAcoes/${usuarioToken}`, 'get');
    return acoes;
  },

  async getFormasPagamentoAsync() {
    return masterApiHelper.buildPromise('FormaPagamento', 'get');
  },

  async getTransportadorasAsync() {
    return masterApiHelper.buildPromise('Transportadora', 'get');
  },

  async getFormasParcelamentoAsync() {
    return masterApiHelper.buildPromise('FormaParcelamento', 'get');
  },

  async putCustomerAsync(customer) {
    return masterApiHelper.buildPromise('Cliente', 'put', customer);
  },

  async putOrderAsync(order) {
    return masterApiHelper.buildPromise('Venda', 'put', order);
  }
}

export default masterApi