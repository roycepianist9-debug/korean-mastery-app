import mysql from 'mysql2/promise';

async function checkMeaningFr() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Query 1: Count empty strings
    const [emptyResult] = await connection.query(
      'SELECT COUNT(*) as count FROM words WHERE `meaningFr` = \'\''
    );
    
    // Query 2: Count non-empty, non-null values
    const [populatedResult] = await connection.query(
      'SELECT COUNT(*) as count FROM words WHERE `meaningFr` IS NOT NULL AND `meaningFr` != \'\''
    );
    
    // Query 3: Get sample data
    const [sampleData] = await connection.query(
      'SELECT korean, meaning, `meaningFr` FROM words WHERE `meaningFr` IS NOT NULL AND `meaningFr` != \'\' LIMIT 5'
    );
    
    console.log(JSON.stringify({
      empty_strings: emptyResult[0].count,
      populated_count: populatedResult[0].count,
      sample_data: sampleData
    }, null, 2));
    
  } finally {
    await connection.end();
  }
}

checkMeaningFr().catch(console.error);
