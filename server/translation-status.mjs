import mysql from "mysql2/promise";

async function checkTranslations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "korean_mastery",
  });

  try {
    const [rows] = await connection.execute(`
      SELECT 
        COUNT(*) as total_words,
        SUM(CASE WHEN koreanExample IS NOT NULL AND koreanExample != '' THEN 1 ELSE 0 END) as korean_examples,
        SUM(CASE WHEN koreanExample IS NOT NULL AND koreanExample != '' AND (exampleEnglish IS NULL OR exampleEnglish = '') THEN 1 ELSE 0 END) as korean_missing_english,
        SUM(CASE WHEN koreanExample IS NOT NULL AND koreanExample != '' AND (exampleFrench IS NULL OR exampleFrench = '') THEN 1 ELSE 0 END) as korean_missing_french,
        SUM(CASE WHEN chineseExample IS NOT NULL AND chineseExample != '' THEN 1 ELSE 0 END) as chinese_examples,
        SUM(CASE WHEN chineseExample IS NOT NULL AND chineseExample != '' AND (exampleChineseFrench IS NULL OR exampleChineseFrench = '') THEN 1 ELSE 0 END) as chinese_missing_french
      FROM words
    `);

    const data = rows[0];
    console.log("\n📊 Translation Status Report");
    console.log("============================\n");
    console.log(`Total words in database: ${data.total_words}\n`);
    
    console.log("🇰🇷 Korean Examples:");
    console.log(`   Total with examples: ${data.korean_examples}`);
    console.log(`   ❌ Missing English: ${data.korean_missing_english}`);
    console.log(`   ❌ Missing French: ${data.korean_missing_french}\n`);
    
    console.log("🇨🇳 Chinese Examples:");
    console.log(`   Total with examples: ${data.chinese_examples}`);
    console.log(`   ❌ Missing French: ${data.chinese_missing_french}\n`);
    
    const totalMissing = data.korean_missing_english + data.korean_missing_french + data.chinese_missing_french;
    console.log(`📝 Total translations needed: ${totalMissing}`);
    
  } finally {
    await connection.end();
  }
}

checkTranslations().catch(console.error);
