export const environment = {
  production: true,                       // (true dans prod.ts)
  serverBaseUrl: 'http://localhost:8084/inesk',
  API_BASE:     'http://localhost:8084/inesk/api',
  WS_ENDPOINT:  'http://localhost:8084/inesk/ws',   // <-- HTTP !
  FILES_BASE:   'http://localhost:8084/inesk/uploads',
  AI_BASE:      'http://localhost:8089'            // <-- ton service IA local
};
