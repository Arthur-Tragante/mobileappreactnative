import moment from 'moment';
import dataStorage from '../services/DataStorage';
import firestoreWrapper from '../services/FirestoreWrapper';

export async function acaoPermitida(acao) {
  let settingsValues = {};
    
  settingsValues = await dataStorage.getStoredSettingsAsync();
  
  if (!settingsValues || settingsValues.Acoes.length == 0) {
    settingsValues = await firestoreWrapper.getSettingsAsync() || {};
  } else {
    settingsValues = settingsValues;
  } 
  
  const index = settingsValues.Acoes.findIndex(i => i.Ref == acao);
  return settingsValues.Acoes[index].Permitido == true;
}

export function getDateTime(date, time) {
  time = new Date(time);
  const dateTime = new Date(date);
  dateTime.setHours(time.getHours());
  dateTime.setMinutes(time.getMinutes());
  dateTime.setSeconds(time.getSeconds());
  return dateTime;
}

export function formataRealFloat(number) {
  if (isNaN(number)) {
    number = 0;
  }

  return parseFloat(Math.round(number * 100) / 100).toFixed(2).toLocaleString('pt-BR');
}

export function formataRealString(number) {
  return `R$ ${formataRealFloat(number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
}

export function formataRealStringSemRS(number) {
  return `${formataRealFloat(number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
}

export function formataRealAbsString(number) {
  return `${number < 0 ? '(' : ''}R$ ${formataRealFloat(Math.abs(number)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${number < 0 ? ')' : ''}`;
}

export function formataDataString(data, includeHour) {
  let date = moment(data);
  return `${date.format('DD/MM/YYYY')} ${includeHour ? date.format('hh:mm:ss') : ''}`;
}

export function formataNumberString(number) {
  let result = Number(number || '');

  if (isNaN(result)) {
    result = 0;
  }

  return result;
}

export function createRangeArray(start, end, step = 1) {
  const len = Math.floor((end - start) / step);
  let array = [];

  for (let i = 0; i <= len; i++) {
    array.push(start + i * step);
  }

  if (!array.includes(end)) {
    array.push(end);
  }

  return array;
}

export function addDays(date, days) {
  let newDate = new Date(date.valueOf());
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

export function getDaysInBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / (oneDay)));;
}

export function getCommaText(texts) {
  let commaText = texts[0];
  for (let index = 1; index < texts.length; index++) {
    const element = texts[index];
    if (index == texts.length - 1) {
      commaText += ' e ';
    } else {
      commaText += ', ';
    }
    commaText += element;
  }
  return commaText.trim();
}

export function sortList(list, alphabeticalSort, dateSort, booleanSort, numericalSort = null) {
  let sortedList = list || [];

  if (alphabeticalSort) {
    sortedList = sortedList.sort((l1, l2) =>
      (l1[alphabeticalSort] || '').toString().toLowerCase() > (l2[alphabeticalSort] || '').toString().toLowerCase()
        ? -1
        : 1
    );
  }

  if (dateSort) {
    sortedList = sortedList.sort((l1, l2) =>
      new Date((l1[dateSort] || '')) < new Date((l2[dateSort] || ''))
        ? -1
        : 1
    );
  }

  if (booleanSort) {
    sortedList = sortedList.sort(l => l[booleanSort] === true);
  }

  if (numericalSort) {
    sortedList = sortedList.sort((l1, l2) =>
      l1[numericalSort] < l2[numericalSort]
        ? -1
        : 1
    );
  }  

  return sortedList;
}

export function genUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function isFunction(fn) {
  return !!(fn && fn.constructor && fn.call && fn.apply);
}

export function validarDocumentoFiscal(documento) {
  if (documento.length == 11) {
    return validarCPF(documento);
  } else {
    return validarCNPJ(documento);
  }
}

function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf == '') return false;
  // Elimina CPFs invalidos conhecidos	
  if (cpf.length != 11 ||
    cpf == "00000000000" ||
    cpf == "11111111111" ||
    cpf == "22222222222" ||
    cpf == "33333333333" ||
    cpf == "44444444444" ||
    cpf == "55555555555" ||
    cpf == "66666666666" ||
    cpf == "77777777777" ||
    cpf == "88888888888" ||
    cpf == "99999999999")
    return false;
  // Valida 1o digito	
  add = 0;
  for (i = 0; i < 9; i++)
    add += parseInt(cpf.charAt(i)) * (10 - i);
  rev = 11 - (add % 11);
  if (rev == 10 || rev == 11)
    rev = 0;
  if (rev != parseInt(cpf.charAt(9)))
    return false;
  // Valida 2o digito	
  add = 0;
  for (i = 0; i < 10; i++)
    add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev == 10 || rev == 11)
    rev = 0;
  if (rev != parseInt(cpf.charAt(10)))
    return false;
  return true;
}

function validarCNPJ(cnpj) {

  cnpj = cnpj.replace(/[^\d]+/g, '');

  if (cnpj == '') return false;

  if (cnpj.length != 14)
    return false;

  // Elimina CNPJs invalidos conhecidos
  if (cnpj == "00000000000000" ||
    cnpj == "11111111111111" ||
    cnpj == "22222222222222" ||
    cnpj == "33333333333333" ||
    cnpj == "44444444444444" ||
    cnpj == "55555555555555" ||
    cnpj == "66666666666666" ||
    cnpj == "77777777777777" ||
    cnpj == "88888888888888" ||
    cnpj == "99999999999999")
    return false;

  // Valida DVs
  tamanho = cnpj.length - 2
  numeros = cnpj.substring(0, tamanho);
  digitos = cnpj.substring(tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2)
      pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(0))
    return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2)
      pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(1))
    return false;

  return true;

}

export function breakLineText(texts) {
  let text = '';
  texts.forEach(element => {
    text += '\n' + element;
  });
  return text.trim();
}