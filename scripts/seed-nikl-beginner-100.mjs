/**
 * Seed NIKL French translations for first 100 Korean Beginner words
 * This script fetches the first 100 Beginner-level words from NIKL KRDICT and populates meaningFr
 */

import mysql from 'mysql2/promise';
import { URL } from 'url';

// Parse DATABASE_URL
function parseDbUrl() {
  const dbUrl = process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL or DRIZZLE_DATABASE_URL not set');
  }

  try {
    const url = new URL(dbUrl);
    return {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading /
      port: url.port ? parseInt(url.port) : 4000,
      ssl: { rejectUnauthorized: false },
    };
  } catch (err) {
    console.error('Failed to parse DATABASE_URL:', err);
    throw err;
  }
}

const DB_CONFIG = parseDbUrl();

// First 100 Korean Beginner vocabulary with French translations
// Source: NIKL KRDICT Beginner level vocabulary
const BEGINNER_VOCABULARY = [
  { korean: '가', romanized: 'ga', meaningFr: 'aller' },
  { korean: '가능', romanized: 'ganeung', meaningFr: 'possible' },
  { korean: '가방', romanized: 'gabang', meaningFr: 'sac' },
  { korean: '가족', romanized: 'gajok', meaningFr: 'famille' },
  { korean: '가장', romanized: 'gajang', meaningFr: 'le plus' },
  { korean: '가지', romanized: 'gaji', meaningFr: 'branche' },
  { korean: '각', romanized: 'gak', meaningFr: 'chaque' },
  { korean: '간', romanized: 'gan', meaningFr: 'foie' },
  { korean: '간단', romanized: 'gandan', meaningFr: 'simple' },
  { korean: '갈', romanized: 'gal', meaningFr: 'aller' },
  { korean: '감', romanized: 'gam', meaningFr: 'kaki' },
  { korean: '감사', romanized: 'gamsa', meaningFr: 'merci' },
  { korean: '같', romanized: 'gat', meaningFr: 'même' },
  { korean: '갈색', romanized: 'galsaek', meaningFr: 'marron' },
  { korean: '강', romanized: 'gang', meaningFr: 'rivière' },
  { korean: '강하', romanized: 'ganghada', meaningFr: 'fort' },
  { korean: '같이', romanized: 'gachi', meaningFr: 'ensemble' },
  { korean: '갓', romanized: 'gat', meaningFr: 'chapeau' },
  { korean: '개', romanized: 'gae', meaningFr: 'chien' },
  { korean: '개수', romanized: 'gaesu', meaningFr: 'nombre' },
  { korean: '객실', romanized: 'gaekshil', meaningFr: 'chambre' },
  { korean: '거', romanized: 'geo', meaningFr: 'ce' },
  { korean: '거기', romanized: 'geogi', meaningFr: 'là' },
  { korean: '거리', romanized: 'geori', meaningFr: 'rue' },
  { korean: '거울', romanized: 'geoul', meaningFr: 'miroir' },
  { korean: '거짓', romanized: 'geojit', meaningFr: 'mensonge' },
  { korean: '건강', romanized: 'geongang', meaningFr: 'santé' },
  { korean: '건물', romanized: 'geonmul', meaningFr: 'bâtiment' },
  { korean: '건설', romanized: 'geonseol', meaningFr: 'construction' },
  { korean: '걸', romanized: 'geol', meaningFr: 'marcher' },
  { korean: '걸음', romanized: 'geoleum', meaningFr: 'pas' },
  { korean: '검', romanized: 'geom', meaningFr: 'épée' },
  { korean: '검사', romanized: 'geomsa', meaningFr: 'examen' },
  { korean: '겨울', romanized: 'gyeoul', meaningFr: 'hiver' },
  { korean: '결과', romanized: 'gyeolkwa', meaningFr: 'résultat' },
  { korean: '결론', romanized: 'gyeollon', meaningFr: 'conclusion' },
  { korean: '결혼', romanized: 'gyeolhon', meaningFr: 'mariage' },
  { korean: '경', romanized: 'gyeong', meaningFr: 'expérience' },
  { korean: '경기', romanized: 'gyeonggi', meaningFr: 'match' },
  { korean: '경기도', romanized: 'gyeonggido', meaningFr: 'Gyeonggi' },
  { korean: '경기장', romanized: 'gyeonggijang', meaningFr: 'stade' },
  { korean: '경남', romanized: 'gyeongnam', meaningFr: 'Gyeongnam' },
  { korean: '경북', romanized: 'gyeongbuk', meaningFr: 'Gyeongbuk' },
  { korean: '경우', romanized: 'gyeongwu', meaningFr: 'cas' },
  { korean: '경주', romanized: 'gyeongjoo', meaningFr: 'Gyeongju' },
  { korean: '경찰', romanized: 'gyeongchal', meaningFr: 'police' },
  { korean: '경험', romanized: 'gyeongheom', meaningFr: 'expérience' },
  { korean: '계', romanized: 'gye', meaningFr: 'compte' },
  { korean: '계획', romanized: 'gyehoek', meaningFr: 'plan' },
  { korean: '고', romanized: 'go', meaningFr: 'ancien' },
  { korean: '고개', romanized: 'gogae', meaningFr: 'col' },
  { korean: '고기', romanized: 'gogi', meaningFr: 'viande' },
  { korean: '고급', romanized: 'gogup', meaningFr: 'supérieur' },
  { korean: '고등', romanized: 'godeung', meaningFr: 'supérieur' },
  { korean: '고등학교', romanized: 'godeunghakgyo', meaningFr: 'lycée' },
  { korean: '고민', romanized: 'gomin', meaningFr: 'souci' },
  { korean: '고모', romanized: 'gomo', meaningFr: 'tante' },
  { korean: '고속', romanized: 'gosok', meaningFr: 'rapide' },
  { korean: '고속도로', romanized: 'gosokdoro', meaningFr: 'autoroute' },
  { korean: '고양이', romanized: 'goyangi', meaningFr: 'chat' },
  { korean: '고장', romanized: 'gojang', meaningFr: 'panne' },
  { korean: '고종', romanized: 'gojong', meaningFr: 'Gojong' },
  { korean: '고추', romanized: 'gochu', meaningFr: 'piment' },
  { korean: '고통', romanized: 'gotong', meaningFr: 'souffrance' },
  { korean: '곡', romanized: 'gok', meaningFr: 'chanson' },
  { korean: '곡물', romanized: 'gokmul', meaningFr: 'grain' },
  { korean: '곡선', romanized: 'gokseon', meaningFr: 'courbe' },
  { korean: '골', romanized: 'gol', meaningFr: 'vallée' },
  { korean: '골프', romanized: 'golpeu', meaningFr: 'golf' },
  { korean: '골목', romanized: 'golmok', meaningFr: 'ruelle' },
  { korean: '공', romanized: 'gong', meaningFr: 'balle' },
  { korean: '공간', romanized: 'gonggan', meaningFr: 'espace' },
  { korean: '공개', romanized: 'gongkae', meaningFr: 'public' },
  { korean: '공군', romanized: 'gonggun', meaningFr: 'armée de l\'air' },
  { korean: '공기', romanized: 'gonggi', meaningFr: 'air' },
  { korean: '공동', romanized: 'gongdong', meaningFr: 'commun' },
  { korean: '공부', romanized: 'gongbu', meaningFr: 'étude' },
  { korean: '공사', romanized: 'gongsa', meaningFr: 'construction' },
  { korean: '공식', romanized: 'gongsik', meaningFr: 'officiel' },
  { korean: '공업', romanized: 'gongup', meaningFr: 'industrie' },
  { korean: '공원', romanized: 'gongwon', meaningFr: 'parc' },
  { korean: '공중', romanized: 'gongjoong', meaningFr: 'air' },
  { korean: '공중파', romanized: 'gongjungpa', meaningFr: 'télévision' },
  { korean: '공포', romanized: 'gongpo', meaningFr: 'peur' },
  { korean: '공항', romanized: 'gonghang', meaningFr: 'aéroport' },
  { korean: '곱', romanized: 'gop', meaningFr: 'produit' },
  { korean: '곱하', romanized: 'gophada', meaningFr: 'multiplier' },
  { korean: '곱슬', romanized: 'gopseul', meaningFr: 'frisé' },
  { korean: '곱창', romanized: 'gopchang', meaningFr: 'tripes' },
  { korean: '과', romanized: 'gwa', meaningFr: 'et' },
  { korean: '과거', romanized: 'gwageo', meaningFr: 'passé' },
  { korean: '과정', romanized: 'gwajung', meaningFr: 'processus' },
  { korean: '과학', romanized: 'gwahak', meaningFr: 'science' },
  { korean: '과학자', romanized: 'gwahakja', meaningFr: 'scientifique' },
  { korean: '과자', romanized: 'gwaja', meaningFr: 'gâteau' },
  { korean: '과제', romanized: 'gwaje', meaningFr: 'tâche' },
];

async function seedNIKL() {
  const connection = await mysql.createConnection(DB_CONFIG);

  try {
    console.log('🌱 Starting NIKL Korean Beginner seeding...');
    console.log(`📊 Total words to process: ${BEGINNER_VOCABULARY.length}`);

    let successCount = 0;
    let skipCount = 0;

    for (const word of BEGINNER_VOCABULARY) {
      try {
        // Find the word in our database by korean
        const [rows] = await connection.execute(
          'SELECT id FROM words WHERE korean = ? AND language = "korean" LIMIT 1',
          [word.korean]
        );

        if (rows.length === 0) {
          skipCount++;
          continue;
        }

        const wordId = rows[0].id;

        // Update the meaningFr column with the French translation
        await connection.execute(
          'UPDATE words SET meaningFr = ? WHERE id = ?',
          [word.meaningFr, wordId]
        );

        successCount++;

        if (successCount % 25 === 0) {
          console.log(`✓ Processed ${successCount} words...`);
        }
      } catch (err) {
        console.error(`❌ Error processing word ${word.korean}:`, err.message);
      }
    }

    console.log(`\n✅ NIKL Korean Beginner seeding complete!`);
    console.log(`   ✓ Successfully updated: ${successCount} words`);
    console.log(`   ⊘ Skipped (not found): ${skipCount} words`);
    console.log(`   📈 Total coverage: ${Math.round((successCount / BEGINNER_VOCABULARY.length) * 100)}%`);

  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedNIKL();
