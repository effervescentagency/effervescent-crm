import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL as string, { ssl: 'require' });

export default sql;
