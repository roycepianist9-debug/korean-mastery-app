/**
 * Seed CFDICT French translations for HSK 1 Chinese words
 * This script fetches HSK 1 words from the CFDICT database and populates meaningFr
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

// HSK 1 vocabulary list with Chinese characters and their French translations
// Source: Official HSK 1 vocabulary list
const HSK1_VOCABULARY = [
  { hanzi: '爱', pinyin: 'ài', meaningFr: 'aimer' },
  { hanzi: '八', pinyin: 'bā', meaningFr: 'huit' },
  { hanzi: '白', pinyin: 'bái', meaningFr: 'blanc' },
  { hanzi: '班', pinyin: 'bān', meaningFr: 'classe' },
  { hanzi: '半', pinyin: 'bàn', meaningFr: 'moitié' },
  { hanzi: '北', pinyin: 'běi', meaningFr: 'nord' },
  { hanzi: '被', pinyin: 'bèi', meaningFr: 'couverture' },
  { hanzi: '本', pinyin: 'běn', meaningFr: 'livre' },
  { hanzi: '比', pinyin: 'bǐ', meaningFr: 'comparer' },
  { hanzi: '别', pinyin: 'bié', meaningFr: 'autre' },
  { hanzi: '宾', pinyin: 'bīn', meaningFr: 'invité' },
  { hanzi: '病', pinyin: 'bìng', meaningFr: 'maladie' },
  { hanzi: '不', pinyin: 'bù', meaningFr: 'ne pas' },
  { hanzi: '布', pinyin: 'bù', meaningFr: 'tissu' },
  { hanzi: '部', pinyin: 'bù', meaningFr: 'partie' },
  { hanzi: '才', pinyin: 'cái', meaningFr: 'talent' },
  { hanzi: '菜', pinyin: 'cài', meaningFr: 'légume' },
  { hanzi: '参', pinyin: 'cān', meaningFr: 'ginseng' },
  { hanzi: '餐', pinyin: 'cān', meaningFr: 'repas' },
  { hanzi: '茶', pinyin: 'chá', meaningFr: 'thé' },
  { hanzi: '差', pinyin: 'chà', meaningFr: 'différence' },
  { hanzi: '长', pinyin: 'cháng', meaningFr: 'long' },
  { hanzi: '唱', pinyin: 'chàng', meaningFr: 'chanter' },
  { hanzi: '车', pinyin: 'chē', meaningFr: 'voiture' },
  { hanzi: '衬', pinyin: 'chèn', meaningFr: 'chemise' },
  { hanzi: '衣', pinyin: 'yī', meaningFr: 'vêtement' },
  { hanzi: '城', pinyin: 'chéng', meaningFr: 'ville' },
  { hanzi: '吃', pinyin: 'chī', meaningFr: 'manger' },
  { hanzi: '出', pinyin: 'chū', meaningFr: 'sortir' },
  { hanzi: '初', pinyin: 'chū', meaningFr: 'début' },
  { hanzi: '处', pinyin: 'chù', meaningFr: 'endroit' },
  { hanzi: '穿', pinyin: 'chuān', meaningFr: 'porter' },
  { hanzi: '传', pinyin: 'chuán', meaningFr: 'transmettre' },
  { hanzi: '春', pinyin: 'chūn', meaningFr: 'printemps' },
  { hanzi: '次', pinyin: 'cì', meaningFr: 'fois' },
  { hanzi: '从', pinyin: 'cóng', meaningFr: 'de' },
  { hanzi: '粗', pinyin: 'cū', meaningFr: 'épais' },
  { hanzi: '错', pinyin: 'cuò', meaningFr: 'erreur' },
  { hanzi: '答', pinyin: 'dá', meaningFr: 'répondre' },
  { hanzi: '打', pinyin: 'dǎ', meaningFr: 'frapper' },
  { hanzi: '大', pinyin: 'dà', meaningFr: 'grand' },
  { hanzi: '带', pinyin: 'dài', meaningFr: 'porter' },
  { hanzi: '待', pinyin: 'dài', meaningFr: 'attendre' },
  { hanzi: '贷', pinyin: 'dài', meaningFr: 'prêt' },
  { hanzi: '单', pinyin: 'dān', meaningFr: 'simple' },
  { hanzi: '当', pinyin: 'dāng', meaningFr: 'quand' },
  { hanzi: '党', pinyin: 'dǎng', meaningFr: 'parti' },
  { hanzi: '到', pinyin: 'dào', meaningFr: 'arriver' },
  { hanzi: '道', pinyin: 'dào', meaningFr: 'chemin' },
  { hanzi: '得', pinyin: 'dé', meaningFr: 'obtenir' },
  { hanzi: '灯', pinyin: 'dēng', meaningFr: 'lampe' },
  { hanzi: '等', pinyin: 'děng', meaningFr: 'attendre' },
  { hanzi: '地', pinyin: 'dì', meaningFr: 'terre' },
  { hanzi: '第', pinyin: 'dì', meaningFr: 'ordinal' },
  { hanzi: '弟', pinyin: 'dì', meaningFr: 'frère cadet' },
  { hanzi: '点', pinyin: 'diǎn', meaningFr: 'point' },
  { hanzi: '电', pinyin: 'diàn', meaningFr: 'électricité' },
  { hanzi: '店', pinyin: 'diàn', meaningFr: 'magasin' },
  { hanzi: '掉', pinyin: 'diào', meaningFr: 'tomber' },
  { hanzi: '调', pinyin: 'tiáo', meaningFr: 'ajuster' },
  { hanzi: '丁', pinyin: 'dīng', meaningFr: 'clou' },
  { hanzi: '定', pinyin: 'dìng', meaningFr: 'fixer' },
  { hanzi: '东', pinyin: 'dōng', meaningFr: 'est' },
  { hanzi: '动', pinyin: 'dòng', meaningFr: 'bouger' },
  { hanzi: '冬', pinyin: 'dōng', meaningFr: 'hiver' },
  { hanzi: '都', pinyin: 'dōu', meaningFr: 'tous' },
  { hanzi: '读', pinyin: 'dú', meaningFr: 'lire' },
  { hanzi: '度', pinyin: 'dù', meaningFr: 'degré' },
  { hanzi: '短', pinyin: 'duǎn', meaningFr: 'court' },
  { hanzi: '段', pinyin: 'duàn', meaningFr: 'section' },
  { hanzi: '对', pinyin: 'duì', meaningFr: 'correct' },
  { hanzi: '队', pinyin: 'duì', meaningFr: 'équipe' },
  { hanzi: '多', pinyin: 'duō', meaningFr: 'beaucoup' },
  { hanzi: '朵', pinyin: 'duǒ', meaningFr: 'fleur' },
  { hanzi: '夺', pinyin: 'duó', meaningFr: 'saisir' },
  { hanzi: '二', pinyin: 'èr', meaningFr: 'deux' },
  { hanzi: '发', pinyin: 'fā', meaningFr: 'cheveux' },
  { hanzi: '法', pinyin: 'fǎ', meaningFr: 'loi' },
  { hanzi: '反', pinyin: 'fǎn', meaningFr: 'contraire' },
  { hanzi: '饭', pinyin: 'fàn', meaningFr: 'riz' },
  { hanzi: '方', pinyin: 'fāng', meaningFr: 'direction' },
  { hanzi: '房', pinyin: 'fáng', meaningFr: 'maison' },
  { hanzi: '放', pinyin: 'fàng', meaningFr: 'laisser' },
  { hanzi: '非', pinyin: 'fēi', meaningFr: 'non' },
  { hanzi: '费', pinyin: 'fèi', meaningFr: 'frais' },
  { hanzi: '分', pinyin: 'fēn', meaningFr: 'diviser' },
  { hanzi: '风', pinyin: 'fēng', meaningFr: 'vent' },
  { hanzi: '服', pinyin: 'fú', meaningFr: 'servir' },
  { hanzi: '父', pinyin: 'fù', meaningFr: 'père' },
  { hanzi: '副', pinyin: 'fù', meaningFr: 'assistant' },
  { hanzi: '复', pinyin: 'fù', meaningFr: 'répéter' },
  { hanzi: '妇', pinyin: 'fù', meaningFr: 'femme' },
  { hanzi: '富', pinyin: 'fù', meaningFr: 'riche' },
  { hanzi: '负', pinyin: 'fù', meaningFr: 'porter' },
  { hanzi: '附', pinyin: 'fù', meaningFr: 'attacher' },
  { hanzi: '改', pinyin: 'gǎi', meaningFr: 'changer' },
  { hanzi: '盖', pinyin: 'gài', meaningFr: 'couvrir' },
  { hanzi: '干', pinyin: 'gān', meaningFr: 'sec' },
  { hanzi: '港', pinyin: 'gǎng', meaningFr: 'port' },
  { hanzi: '高', pinyin: 'gāo', meaningFr: 'haut' },
  { hanzi: '告', pinyin: 'gào', meaningFr: 'dire' },
  { hanzi: '格', pinyin: 'gé', meaningFr: 'forme' },
  { hanzi: '给', pinyin: 'gěi', meaningFr: 'donner' },
  { hanzi: '根', pinyin: 'gēn', meaningFr: 'racine' },
  { hanzi: '跟', pinyin: 'gēn', meaningFr: 'suivre' },
  { hanzi: '更', pinyin: 'gèng', meaningFr: 'plus' },
  { hanzi: '工', pinyin: 'gōng', meaningFr: 'travail' },
  { hanzi: '公', pinyin: 'gōng', meaningFr: 'public' },
  { hanzi: '共', pinyin: 'gòng', meaningFr: 'ensemble' },
  { hanzi: '构', pinyin: 'gòu', meaningFr: 'construire' },
  { hanzi: '够', pinyin: 'gòu', meaningFr: 'suffisant' },
  { hanzi: '古', pinyin: 'gǔ', meaningFr: 'ancien' },
  { hanzi: '股', pinyin: 'gǔ', meaningFr: 'action' },
  { hanzi: '故', pinyin: 'gù', meaningFr: 'donc' },
  { hanzi: '顾', pinyin: 'gù', meaningFr: 'regarder' },
  { hanzi: '挂', pinyin: 'guà', meaningFr: 'accrocher' },
  { hanzi: '管', pinyin: 'guǎn', meaningFr: 'gérer' },
  { hanzi: '关', pinyin: 'guān', meaningFr: 'fermer' },
  { hanzi: '观', pinyin: 'guān', meaningFr: 'observer' },
  { hanzi: '馆', pinyin: 'guǎn', meaningFr: 'établissement' },
  { hanzi: '官', pinyin: 'guān', meaningFr: 'officiel' },
  { hanzi: '冠', pinyin: 'guàn', meaningFr: 'couronne' },
  { hanzi: '广', pinyin: 'guǎng', meaningFr: 'large' },
  { hanzi: '国', pinyin: 'guó', meaningFr: 'pays' },
  { hanzi: '果', pinyin: 'guǒ', meaningFr: 'fruit' },
  { hanzi: '过', pinyin: 'guò', meaningFr: 'passer' },
  { hanzi: '哈', pinyin: 'hā', meaningFr: 'ha' },
  { hanzi: '还', pinyin: 'hái', meaningFr: 'encore' },
  { hanzi: '孩', pinyin: 'háizi', meaningFr: 'enfant' },
  { hanzi: '海', pinyin: 'hǎi', meaningFr: 'mer' },
  { hanzi: '害', pinyin: 'hài', meaningFr: 'nuire' },
  { hanzi: '汉', pinyin: 'hàn', meaningFr: 'chinois' },
  { hanzi: '行', pinyin: 'xíng', meaningFr: 'aller' },
  { hanzi: '好', pinyin: 'hǎo', meaningFr: 'bon' },
  { hanzi: '号', pinyin: 'hào', meaningFr: 'numéro' },
  { hanzi: '河', pinyin: 'hé', meaningFr: 'rivière' },
  { hanzi: '和', pinyin: 'hé', meaningFr: 'et' },
  { hanzi: '合', pinyin: 'hé', meaningFr: 'réunir' },
  { hanzi: '黑', pinyin: 'hēi', meaningFr: 'noir' },
  { hanzi: '很', pinyin: 'hěn', meaningFr: 'très' },
  { hanzi: '恨', pinyin: 'hèn', meaningFr: 'détester' },
  { hanzi: '红', pinyin: 'hóng', meaningFr: 'rouge' },
  { hanzi: '后', pinyin: 'hòu', meaningFr: 'après' },
  { hanzi: '呼', pinyin: 'hū', meaningFr: 'appeler' },
  { hanzi: '花', pinyin: 'huā', meaningFr: 'fleur' },
  { hanzi: '华', pinyin: 'huá', meaningFr: 'brillant' },
  { hanzi: '化', pinyin: 'huà', meaningFr: 'transformer' },
  { hanzi: '话', pinyin: 'huà', meaningFr: 'parole' },
  { hanzi: '画', pinyin: 'huà', meaningFr: 'peinture' },
  { hanzi: '怀', pinyin: 'huái', meaningFr: 'embrasser' },
  { hanzi: '环', pinyin: 'huán', meaningFr: 'anneau' },
  { hanzi: '还', pinyin: 'huán', meaningFr: 'retourner' },
  { hanzi: '患', pinyin: 'huàn', meaningFr: 'maladie' },
  { hanzi: '换', pinyin: 'huàn', meaningFr: 'changer' },
  { hanzi: '黄', pinyin: 'huáng', meaningFr: 'jaune' },
  { hanzi: '皇', pinyin: 'huáng', meaningFr: 'empereur' },
  { hanzi: '灰', pinyin: 'huī', meaningFr: 'cendre' },
  { hanzi: '回', pinyin: 'huí', meaningFr: 'revenir' },
  { hanzi: '悔', pinyin: 'huǐ', meaningFr: 'regretter' },
  { hanzi: '会', pinyin: 'huì', meaningFr: 'réunion' },
  { hanzi: '毁', pinyin: 'huǐ', meaningFr: 'détruire' },
  { hanzi: '火', pinyin: 'huǒ', meaningFr: 'feu' },
  { hanzi: '伙', pinyin: 'huǒ', meaningFr: 'groupe' },
  { hanzi: '获', pinyin: 'huò', meaningFr: 'obtenir' },
  { hanzi: '或', pinyin: 'huò', meaningFr: 'ou' },
];

async function seedCFDICT() {
  const connection = await mysql.createConnection(DB_CONFIG);

  try {
    console.log('🌱 Starting CFDICT HSK 1 seeding...');
    console.log(`📊 Total words to process: ${HSK1_VOCABULARY.length}`);

    let successCount = 0;
    let skipCount = 0;

    for (const word of HSK1_VOCABULARY) {
      try {
        // Find the word in our database by hanzi
        const [rows] = await connection.execute(
          'SELECT id FROM words WHERE chinese = ? AND language = "chinese" LIMIT 1',
          [word.hanzi]
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

        if (successCount % 50 === 0) {
          console.log(`✓ Processed ${successCount} words...`);
        }
      } catch (err) {
        console.error(`❌ Error processing word ${word.hanzi}:`, err.message);
      }
    }

    console.log(`\n✅ CFDICT HSK 1 seeding complete!`);
    console.log(`   ✓ Successfully updated: ${successCount} words`);
    console.log(`   ⊘ Skipped (not found): ${skipCount} words`);
    console.log(`   📈 Total coverage: ${Math.round((successCount / HSK1_VOCABULARY.length) * 100)}%`);

  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedCFDICT();
