import * as Type from '../actions';

const productsState = {
  selectedProduct: null,
};

products = (state = productsState, action) => {
  switch (action.type) {

    case Type.SET_SELECTED_PRODUCT:
      return {
        ...state,
        selectedProduct: action.selectedProduct,
      }

    default:
      return state;

  }
};

export default products;