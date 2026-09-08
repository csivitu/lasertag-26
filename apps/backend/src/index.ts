import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

import teamsRouter from './routes/teams';
import slotsRouter from './routes/slots';
import verificationRouter from './routes/verification';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/teams', teamsRouter);
app.use('/slots', slotsRouter);
app.use('/verification', verificationRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 LaserTag Backend API running on port ${PORT}`);
  console.log(`📖 Swagger API Docs available at http://localhost:${PORT}/docs`);
});

export default app;
