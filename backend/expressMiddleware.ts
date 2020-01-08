import { HTTP_STATUS } from '@voiceflow/verror';
import bodyParser from 'body-parser';
import PrettyStream from 'bunyan-prettystream';
import compression from 'compression';
import timeout from 'connect-timeout';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import * as Express from 'express';
import expressLogger from 'express-bunyan-logger';
import helmet from 'helmet';
import _ from 'lodash';

import { ControllerMap, MiddlewareMap } from '@/lib';
import pjson from '@/package.json';

import api from './api';

const name = pjson.name.replace(/^@[a-zA-Z0-9-]+\//g, '');

const prettyStdOut = new PrettyStream({ mode: 'dev' });
prettyStdOut.pipe(process.stdout);

const ERROR_RESPONSE_MS = 10000;
const WARN_RESPONSE_MS = 5000;

/**
 * @class
 */
class ExpressMiddleware {
  /**
   * Attach express middleware to app
   */
  static attach(app: Express.Application, middlewares: MiddlewareMap, controllers: ControllerMap) {
    if (!_.isObject(app) || !_.isObject(middlewares) || !_.isObject(controllers)) {
      throw new Error('must have app, middlewares, and controllers');
    }

    // Reflect requested object for effectively a wildcard CORS setting
    const corsOptions = {
      origin: true,
      credentials: true,
    };

    app.use(cors(corsOptions));
    app.use(helmet());

    app.use(compression());
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(
      bodyParser.urlencoded({
        limit: '50mb',
        extended: true,
      })
    );
    app.use(cookieParser());
    app.enable('trust proxy');
    app.disable('x-powered-by');

    const logMiddleware = expressLogger({
      name: `${name}-express`,
      format: ':status-code - :method :url - response-time: :response-time',
      streams: [
        {
          level: 'info',
          stream: process.env.NODE_ENV === 'production' ? process.stdout : prettyStdOut,
        },
      ],
      excludes: ['*'],
      levelFn: (_status, _err, meta) => {
        if (meta['response-time'] > ERROR_RESPONSE_MS) {
          return 'error';
        }
        if (meta['response-time'] > WARN_RESPONSE_MS) {
          return 'warn';
        }
        if (meta['status-code'] >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
          return 'error';
        }
        if (meta['status-code'] >= HTTP_STATUS.BAD_REQUEST) {
          return 'warn';
        }
        return 'trace'; // Do not log 200
      },
    });

    app.use(logMiddleware);

    app.use(timeout(String(ERROR_RESPONSE_MS)));
    app.use((req, _res, next) => !req.timedout && next());

    // All valid routes handled here
    app.use(api(middlewares, controllers));
  }
}

export default ExpressMiddleware;
