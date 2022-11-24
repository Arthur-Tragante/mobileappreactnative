import * as Type from '../actions';

const ordersState = {
  selectedOrder: null,
};

orders = (state = ordersState, action) => {
  switch (action.type) {

    case Type.SET_SELECTED_ORDER:
      return {
        ...state,
        selectedOrder: action.selectedOrder,
      };

    default:
      return state;

  }
};

export default orders;
