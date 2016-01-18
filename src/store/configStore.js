import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import * as reducers from '../reducers';
import { logger, reduxRouter, thunk } from '../middlewares';

const rootReducer = combineReducers(reducers);

const middlewares = [
  thunk,
  logger,
  reduxRouter,
];

const createStoreWithMiddleware = compose(
  applyMiddleware(...middlewares),
)(createStore);

const configureStore = (initialState) => {
  const store = createStoreWithMiddleware(rootReducer, initialState);

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers');
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
};

export default configureStore;
