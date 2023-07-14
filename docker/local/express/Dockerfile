ARG NODE_VERSION=16-alpine

FROM node:${NODE_VERSION}

LABEL name="mern-invoice"
LABEL license="MIT"
LABEL description="MERN Invoice image"

ENV NODE_ENV=development

ARG APP_HOME=/app

WORKDIR ${APP_HOME}

RUN addgroup --system invoice \
    && adduser --system --ingroup invoice invoice

COPY package*.json .

RUN npm install

COPY --chown=invoice:invoice . ${APP_HOME}

RUN chown invoice:invoice ${APP_HOME}

USER invoice

CMD ["npm", "run", "dev"]

