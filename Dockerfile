FROM node:16-alpine as build

ARG NPM_TOKEN

WORKDIR /target
COPY ./ ./

RUN echo $NPM_TOKEN > .npmrc && \
  yarn install --ignore-scripts && \
  yarn build && \
  rm -rf build/node_modules && \
  rm -f .npmrc

FROM node:16-alpine

ARG NPM_TOKEN

ARG build_SEM_VER
ARG build_BUILD_NUM
ARG build_GIT_SHA
ARG build_BUILD_URL

ENV SEM_VER=${build_SEM_VER}
ENV BUILD_NUM=${build_BUILD_NUM}
ENV GIT_SHA=${build_GIT_SHA}
ENV BUILD_URL=${build_BUILD_URL}

RUN apk add --no-cache dumb-init

WORKDIR /usr/src/app
COPY --from=build /target/build ./

RUN echo $NPM_TOKEN > .npmrc && \
  yarn install --production --ignore-scripts && \
  rm -f .npmrc && \
  yarn cache clean

ENTRYPOINT [ "dumb-init" ]
CMD ["node", "start.js"]
