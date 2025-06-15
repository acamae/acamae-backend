import app from './infrastructure/app.js';
import { config } from './infrastructure/config/environment.js';

// Iniciar servidor
const PORT = config.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Ambiente: ${config.NODE_ENV || 'development'}`);
});
