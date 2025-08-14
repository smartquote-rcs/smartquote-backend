import swaggerAutogen from 'swagger-autogen';

const outputFile = './swagger.json';
const endpointsFiles = ['./index.ts'];

const doc = {
    info: {
        title: 'API infraWatch',
        description: 'API para gereciamento do smartquote.'
    },
    host: 'localhost:3000/api',
    schemes: ['http']
};

swaggerAutogen()(outputFile, endpointsFiles, doc);