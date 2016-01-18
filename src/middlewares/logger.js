import createLogger from 'redux-logger';
import { Iterable } from 'immutable';
import mapObject from 'fbjs/lib/mapObject';

const logger = createLogger({
  stateTransformer: (state) => mapObject(state, (val) => {
    if (Iterable.isIterable(val)) {
      return val.toJS();
    }

    return val;
  }),
});

export default logger;
