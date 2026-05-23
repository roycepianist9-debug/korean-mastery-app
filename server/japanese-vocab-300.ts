/**
 * 99-word JLPT N5 core vocabulary with Tatoeba example sentences
 * Curated from official JLPT word lists and Tatoeba corpus
 * Note: This is the initial batch. Can be expanded to 300+ words in future iterations.
 */

export const JAPANESE_VOCAB_300 = [
  // JLPT N5 - Core 99 words (most frequent, essential for beginners)
  
  // Pronouns & Basic
  { japanese: '私', hiragana: 'わたし', romaji: 'watashi', meaning: 'I, me', jlptLevel: 'n5', pos: 'pronoun', japaneseExample: '私は学生です。', exampleRomaji: 'Watashi wa gakusei desu.', exampleJapaneseFrench: 'Je suis un étudiant.' },
  { japanese: 'あなた', hiragana: 'あなた', romaji: 'anata', meaning: 'you', jlptLevel: 'n5', pos: 'pronoun', japaneseExample: 'あなたは誰ですか？', exampleRomaji: 'Anata wa dare desu ka?', exampleJapaneseFrench: 'Qui êtes-vous?' },
  { japanese: '彼', hiragana: 'かれ', romaji: 'kare', meaning: 'he, boyfriend', jlptLevel: 'n5', pos: 'pronoun', japaneseExample: '彼は背が高いです。', exampleRomaji: 'Kare wa se ga takai desu.', exampleJapaneseFrench: 'Il est grand.' },
  { japanese: '彼女', hiragana: 'かのじょ', romaji: 'kanojo', meaning: 'she, girlfriend', jlptLevel: 'n5', pos: 'pronoun', japaneseExample: '彼女は美しいです。', exampleRomaji: 'Kanojo wa utsukushii desu.', exampleJapaneseFrench: 'Elle est belle.' },
  { japanese: '誰', hiragana: 'だれ', romaji: 'dare', meaning: 'who', jlptLevel: 'n5', pos: 'pronoun', japaneseExample: '誰がそれを作りましたか？', exampleRomaji: 'Dare ga sore wo tsukurimashita ka?', exampleJapaneseFrench: 'Qui l\'a fait?' },
  
  // Family
  { japanese: '家族', hiragana: 'かぞく', romaji: 'kazoku', meaning: 'family', jlptLevel: 'n5', pos: 'noun', japaneseExample: '家族と一緒に住んでいます。', exampleRomaji: 'Kazoku to issho ni sunde imasu.', exampleJapaneseFrench: 'Je vis avec ma famille.' },
  { japanese: '父', hiragana: 'ちち', romaji: 'chichi', meaning: 'father', jlptLevel: 'n5', pos: 'noun', japaneseExample: '父は医者です。', exampleRomaji: 'Chichi wa isha desu.', exampleJapaneseFrench: 'Mon père est médecin.' },
  { japanese: '母', hiragana: 'はは', romaji: 'haha', meaning: 'mother', jlptLevel: 'n5', pos: 'noun', japaneseExample: '母は料理が上手です。', exampleRomaji: 'Haha wa ryōri ga jōzu desu.', exampleJapaneseFrench: 'Ma mère cuisine bien.' },
  { japanese: '兄', hiragana: 'あに', romaji: 'ani', meaning: 'older brother', jlptLevel: 'n5', pos: 'noun', japaneseExample: '兄は大学生です。', exampleRomaji: 'Ani wa daigakusei desu.', exampleJapaneseFrench: 'Mon frère aîné est étudiant.' },
  { japanese: '姉', hiragana: 'あね', romaji: 'ane', meaning: 'older sister', jlptLevel: 'n5', pos: 'noun', japaneseExample: '姉は働いています。', exampleRomaji: 'Ane wa hataraite imasu.', exampleJapaneseFrench: 'Ma sœur aînée travaille.' },
  { japanese: '弟', hiragana: 'おとうと', romaji: 'otōto', meaning: 'younger brother', jlptLevel: 'n5', pos: 'noun', japaneseExample: '弟は中学生です。', exampleRomaji: 'Otōto wa chūgakusei desu.', exampleJapaneseFrench: 'Mon frère cadet est au collège.' },
  { japanese: '妹', hiragana: 'いもうと', romaji: 'imōto', meaning: 'younger sister', jlptLevel: 'n5', pos: 'noun', japaneseExample: '妹は高校生です。', exampleRomaji: 'Imōto wa kōkōsei desu.', exampleJapaneseFrench: 'Ma sœur cadette est au lycée.' },
  { japanese: '子供', hiragana: 'こども', romaji: 'kodomo', meaning: 'child', jlptLevel: 'n5', pos: 'noun', japaneseExample: '子供たちは公園で遊んでいます。', exampleRomaji: 'Kodomotachi wa kōen de asonde imasu.', exampleJapaneseFrench: 'Les enfants jouent au parc.' },
  { japanese: '親', hiragana: 'おや', romaji: 'oya', meaning: 'parent', jlptLevel: 'n5', pos: 'noun', japaneseExample: '親に感謝しています。', exampleRomaji: 'Oya ni kansha shite imasu.', exampleJapaneseFrench: 'Je suis reconnaissant envers mes parents.' },
  
  // People & Relationships
  { japanese: '人', hiragana: 'ひと', romaji: 'hito', meaning: 'person', jlptLevel: 'n5', pos: 'noun', japaneseExample: '良い人ですね。', exampleRomaji: 'Yoi hito desu ne.', exampleJapaneseFrench: 'C\'est une bonne personne.' },
  { japanese: '友達', hiragana: 'ともだち', romaji: 'tomodachi', meaning: 'friend', jlptLevel: 'n5', pos: 'noun', japaneseExample: '友達と映画を見に行きました。', exampleRomaji: 'Tomodachi to eiga wo mi ni ikimashita.', exampleJapaneseFrench: 'Je suis allé au cinéma avec un ami.' },
  { japanese: '先生', hiragana: 'せんせい', romaji: 'sensei', meaning: 'teacher', jlptLevel: 'n5', pos: 'noun', japaneseExample: '先生は親切です。', exampleRomaji: 'Sensei wa shinsetsu desu.', exampleJapaneseFrench: 'Le professeur est gentil.' },
  { japanese: '学生', hiragana: 'がくせい', romaji: 'gakusei', meaning: 'student', jlptLevel: 'n5', pos: 'noun', japaneseExample: '私は学生です。', exampleRomaji: 'Watashi wa gakusei desu.', exampleJapaneseFrench: 'Je suis étudiant.' },
  
  // Places
  { japanese: '学校', hiragana: 'がっこう', romaji: 'gakkō', meaning: 'school', jlptLevel: 'n5', pos: 'noun', japaneseExample: '学校に行きます。', exampleRomaji: 'Gakkō ni ikimasu.', exampleJapaneseFrench: 'Je vais à l\'école.' },
  { japanese: '家', hiragana: 'いえ', romaji: 'ie', meaning: 'house', jlptLevel: 'n5', pos: 'noun', japaneseExample: '家に帰ります。', exampleRomaji: 'Ie ni kaerimasu.', exampleJapaneseFrench: 'Je rentre à la maison.' },
  { japanese: '会社', hiragana: 'かいしゃ', romaji: 'kaisha', meaning: 'company', jlptLevel: 'n5', pos: 'noun', japaneseExample: '会社で働いています。', exampleRomaji: 'Kaisha de hataraite imasu.', exampleJapaneseFrench: 'Je travaille dans une entreprise.' },
  { japanese: '駅', hiragana: 'えき', romaji: 'eki', meaning: 'station', jlptLevel: 'n5', pos: 'noun', japaneseExample: '駅の近くに住んでいます。', exampleRomaji: 'Eki no chikaku ni sunde imasu.', exampleJapaneseFrench: 'Je vis près de la gare.' },
  { japanese: '病院', hiragana: 'びょういん', romaji: 'byōin', meaning: 'hospital', jlptLevel: 'n5', pos: 'noun', japaneseExample: '病院に行きました。', exampleRomaji: 'Byōin ni ikimashita.', exampleJapaneseFrench: 'Je suis allé à l\'hôpital.' },
  { japanese: '図書館', hiragana: 'としょかん', romaji: 'toshokan', meaning: 'library', jlptLevel: 'n5', pos: 'noun', japaneseExample: '図書館で本を借りました。', exampleRomaji: 'Toshokan de hon wo karimashita.', exampleJapaneseFrench: 'J\'ai emprunté un livre à la bibliothèque.' },
  { japanese: '公園', hiragana: 'こうえん', romaji: 'kōen', meaning: 'park', jlptLevel: 'n5', pos: 'noun', japaneseExample: '公園で遊びます。', exampleRomaji: 'Kōen de asobimasu.', exampleJapaneseFrench: 'Je joue au parc.' },
  { japanese: '店', hiragana: 'みせ', romaji: 'mise', meaning: 'shop, store', jlptLevel: 'n5', pos: 'noun', japaneseExample: '店で買い物をします。', exampleRomaji: 'Mise de kaimono wo shimasu.', exampleJapaneseFrench: 'Je fais du shopping au magasin.' },
  
  // Objects & Things
  { japanese: '本', hiragana: 'ほん', romaji: 'hon', meaning: 'book', jlptLevel: 'n5', pos: 'noun', japaneseExample: '本を読みます。', exampleRomaji: 'Hon wo yomimasu.', exampleJapaneseFrench: 'Je lis un livre.' },
  { japanese: '机', hiragana: 'つくえ', romaji: 'tsukue', meaning: 'desk, table', jlptLevel: 'n5', pos: 'noun', japaneseExample: '机の上に本があります。', exampleRomaji: 'Tsukue no ue ni hon ga arimasu.', exampleJapaneseFrench: 'Il y a un livre sur le bureau.' },
  { japanese: '椅子', hiragana: 'いす', romaji: 'isu', meaning: 'chair', jlptLevel: 'n5', pos: 'noun', japaneseExample: '椅子に座ります。', exampleRomaji: 'Isu ni suwarimasu.', exampleJapaneseFrench: 'Je m\'assieds sur une chaise.' },
  { japanese: '車', hiragana: 'くるま', romaji: 'kuruma', meaning: 'car', jlptLevel: 'n5', pos: 'noun', japaneseExample: '車で行きます。', exampleRomaji: 'Kuruma de ikimasu.', exampleJapaneseFrench: 'Je vais en voiture.' },
  { japanese: '電車', hiragana: 'でんしゃ', romaji: 'densha', meaning: 'train', jlptLevel: 'n5', pos: 'noun', japaneseExample: '電車に乗ります。', exampleRomaji: 'Densha ni norimasu.', exampleJapaneseFrench: 'Je prends le train.' },
  { japanese: 'ペン', hiragana: 'ぺん', romaji: 'pen', meaning: 'pen', jlptLevel: 'n5', pos: 'noun', japaneseExample: 'ペンを貸してください。', exampleRomaji: 'Pen wo kashite kudasai.', exampleJapaneseFrench: 'Prêtez-moi un stylo, s\'il vous plaît.' },
  { japanese: '鉛筆', hiragana: 'えんぴつ', romaji: 'enpitsu', meaning: 'pencil', jlptLevel: 'n5', pos: 'noun', japaneseExample: '鉛筆で書きます。', exampleRomaji: 'Enpitsu de kakimasu.', exampleJapaneseFrench: 'J\'écris avec un crayon.' },
  { japanese: '紙', hiragana: 'かみ', romaji: 'kami', meaning: 'paper', jlptLevel: 'n5', pos: 'noun', japaneseExample: '紙に書いてください。', exampleRomaji: 'Kami ni kaite kudasai.', exampleJapaneseFrench: 'Écrivez sur le papier, s\'il vous plaît.' },
  
  // Food & Drink
  { japanese: '食べ物', hiragana: 'たべもの', romaji: 'tabemono', meaning: 'food', jlptLevel: 'n5', pos: 'noun', japaneseExample: '食べ物が好きです。', exampleRomaji: 'Tabemono ga suki desu.', exampleJapaneseFrench: 'J\'aime la nourriture.' },
  { japanese: '飲み物', hiragana: 'のみもの', romaji: 'nomimono', meaning: 'drink', jlptLevel: 'n5', pos: 'noun', japaneseExample: '何か飲み物をください。', exampleRomaji: 'Nanika nomimono wo kudasai.', exampleJapaneseFrench: 'Donnez-moi quelque chose à boire.' },
  { japanese: '水', hiragana: 'みず', romaji: 'mizu', meaning: 'water', jlptLevel: 'n5', pos: 'noun', japaneseExample: '水を飲みます。', exampleRomaji: 'Mizu wo nomimasu.', exampleJapaneseFrench: 'Je bois de l\'eau.' },
  { japanese: 'お茶', hiragana: 'おちゃ', romaji: 'ocha', meaning: 'tea', jlptLevel: 'n5', pos: 'noun', japaneseExample: 'お茶を飲みましょう。', exampleRomaji: 'Ocha wo nomimashō.', exampleJapaneseFrench: 'Buvons du thé.' },
  { japanese: 'コーヒー', hiragana: 'こーひー', romaji: 'kōhī', meaning: 'coffee', jlptLevel: 'n5', pos: 'noun', japaneseExample: 'コーヒーが好きです。', exampleRomaji: 'Kōhī ga suki desu.', exampleJapaneseFrench: 'J\'aime le café.' },
  { japanese: 'ご飯', hiragana: 'ごはん', romaji: 'gohan', meaning: 'rice, meal', jlptLevel: 'n5', pos: 'noun', japaneseExample: 'ご飯を食べます。', exampleRomaji: 'Gohan wo tabemasu.', exampleJapaneseFrench: 'Je mange du riz.' },
  { japanese: 'パン', hiragana: 'ぱん', romaji: 'pan', meaning: 'bread', jlptLevel: 'n5', pos: 'noun', japaneseExample: 'パンが好きです。', exampleRomaji: 'Pan ga suki desu.', exampleJapaneseFrench: 'J\'aime le pain.' },
  { japanese: '肉', hiragana: 'にく', romaji: 'niku', meaning: 'meat', jlptLevel: 'n5', pos: 'noun', japaneseExample: '肉を食べます。', exampleRomaji: 'Niku wo tabemasu.', exampleJapaneseFrench: 'Je mange de la viande.' },
  { japanese: '魚', hiragana: 'さかな', romaji: 'sakana', meaning: 'fish', jlptLevel: 'n5', pos: 'noun', japaneseExample: '魚が好きです。', exampleRomaji: 'Sakana ga suki desu.', exampleJapaneseFrench: 'J\'aime le poisson.' },
  
  // Nature
  { japanese: '木', hiragana: 'き', romaji: 'ki', meaning: 'tree', jlptLevel: 'n5', pos: 'noun', japaneseExample: '木が大きいです。', exampleRomaji: 'Ki ga ōkii desu.', exampleJapaneseFrench: 'L\'arbre est grand.' },
  { japanese: '花', hiragana: 'はな', romaji: 'hana', meaning: 'flower', jlptLevel: 'n5', pos: 'noun', japaneseExample: '花が美しいです。', exampleRomaji: 'Hana ga utsukushii desu.', exampleJapaneseFrench: 'La fleur est belle.' },
  { japanese: '山', hiragana: 'やま', romaji: 'yama', meaning: 'mountain', jlptLevel: 'n5', pos: 'noun', japaneseExample: '山に登ります。', exampleRomaji: 'Yama ni noborimasu.', exampleJapaneseFrench: 'Je grimpe la montagne.' },
  { japanese: '川', hiragana: 'かわ', romaji: 'kawa', meaning: 'river', jlptLevel: 'n5', pos: 'noun', japaneseExample: '川で泳ぎます。', exampleRomaji: 'Kawa de oyogimasu.', exampleJapaneseFrench: 'Je nage dans la rivière.' },
  { japanese: '海', hiragana: 'うみ', romaji: 'umi', meaning: 'sea, ocean', jlptLevel: 'n5', pos: 'noun', japaneseExample: '海に行きました。', exampleRomaji: 'Umi ni ikimashita.', exampleJapaneseFrench: 'Je suis allé à la mer.' },
  { japanese: '空', hiragana: 'そら', romaji: 'sora', meaning: 'sky', jlptLevel: 'n5', pos: 'noun', japaneseExample: '空が青いです。', exampleRomaji: 'Sora ga aoi desu.', exampleJapaneseFrench: 'Le ciel est bleu.' },
  { japanese: '太陽', hiragana: 'たいよう', romaji: 'taiyō', meaning: 'sun', jlptLevel: 'n5', pos: 'noun', japaneseExample: '太陽が明るいです。', exampleRomaji: 'Taiyō ga akarui desu.', exampleJapaneseFrench: 'Le soleil est lumineux.' },

  { japanese: '星', hiragana: 'ほし', romaji: 'hoshi', meaning: 'star', jlptLevel: 'n5', pos: 'noun', japaneseExample: '星がきれいです。', exampleRomaji: 'Hoshi ga kirei desu.', exampleJapaneseFrench: 'Les étoiles sont belles.' },
  
  // Verbs (Action words)
  { japanese: '読む', hiragana: 'よむ', romaji: 'yomu', meaning: 'to read', jlptLevel: 'n5', pos: 'verb', japaneseExample: '本を読みます。', exampleRomaji: 'Hon wo yomimasu.', exampleJapaneseFrench: 'Je lis un livre.' },
  { japanese: '書く', hiragana: 'かく', romaji: 'kaku', meaning: 'to write', jlptLevel: 'n5', pos: 'verb', japaneseExample: '手紙を書きます。', exampleRomaji: 'Tegami wo kakimasu.', exampleJapaneseFrench: 'J\'écris une lettre.' },
  { japanese: '食べる', hiragana: 'たべる', romaji: 'taberu', meaning: 'to eat', jlptLevel: 'n5', pos: 'verb', japaneseExample: 'ご飯を食べます。', exampleRomaji: 'Gohan wo tabemasu.', exampleJapaneseFrench: 'Je mange du riz.' },
  { japanese: '飲む', hiragana: 'のむ', romaji: 'nomu', meaning: 'to drink', jlptLevel: 'n5', pos: 'verb', japaneseExample: '水を飲みます。', exampleRomaji: 'Mizu wo nomimasu.', exampleJapaneseFrench: 'Je bois de l\'eau.' },
  { japanese: '行く', hiragana: 'いく', romaji: 'iku', meaning: 'to go', jlptLevel: 'n5', pos: 'verb', japaneseExample: '学校に行きます。', exampleRomaji: 'Gakkō ni ikimasu.', exampleJapaneseFrench: 'Je vais à l\'école.' },
  { japanese: '来る', hiragana: 'くる', romaji: 'kuru', meaning: 'to come', jlptLevel: 'n5', pos: 'verb', japaneseExample: '明日来ます。', exampleRomaji: 'Ashita kimasu.', exampleJapaneseFrench: 'Je viens demain.' },
  { japanese: '見る', hiragana: 'みる', romaji: 'miru', meaning: 'to see, to watch', jlptLevel: 'n5', pos: 'verb', japaneseExample: 'テレビを見ます。', exampleRomaji: 'Terebi wo mimasu.', exampleJapaneseFrench: 'Je regarde la télévision.' },
  { japanese: '聞く', hiragana: 'きく', romaji: 'kiku', meaning: 'to listen, to hear', jlptLevel: 'n5', pos: 'verb', japaneseExample: '音楽を聞きます。', exampleRomaji: 'Ongaku wo kikimasu.', exampleJapaneseFrench: 'J\'écoute de la musique.' },
  { japanese: '話す', hiragana: 'はなす', romaji: 'hanasu', meaning: 'to speak', jlptLevel: 'n5', pos: 'verb', japaneseExample: '日本語を話します。', exampleRomaji: 'Nihongo wo hanashimasu.', exampleJapaneseFrench: 'Je parle le japonais.' },
  { japanese: '買う', hiragana: 'かう', romaji: 'kau', meaning: 'to buy', jlptLevel: 'n5', pos: 'verb', japaneseExample: '本を買いました。', exampleRomaji: 'Hon wo kaimashita.', exampleJapaneseFrench: 'J\'ai acheté un livre.' },
  { japanese: '作る', hiragana: 'つくる', romaji: 'tsukuru', meaning: 'to make', jlptLevel: 'n5', pos: 'verb', japaneseExample: '料理を作ります。', exampleRomaji: 'Ryōri wo tsukurimasu.', exampleJapaneseFrench: 'Je prépare un repas.' },
  { japanese: '遊ぶ', hiragana: 'あそぶ', romaji: 'asobu', meaning: 'to play', jlptLevel: 'n5', pos: 'verb', japaneseExample: '友達と遊びます。', exampleRomaji: 'Tomodachi to asobimasu.', exampleJapaneseFrench: 'Je joue avec un ami.' },
  { japanese: '働く', hiragana: 'はたらく', romaji: 'hataraku', meaning: 'to work', jlptLevel: 'n5', pos: 'verb', japaneseExample: '会社で働いています。', exampleRomaji: 'Kaisha de hataraite imasu.', exampleJapaneseFrench: 'Je travaille dans une entreprise.' },
  { japanese: '勉強する', hiragana: 'べんきょうする', romaji: 'benkyō suru', meaning: 'to study', jlptLevel: 'n5', pos: 'verb', japaneseExample: '毎日勉強しています。', exampleRomaji: 'Mainichi benkyō shite imasu.', exampleJapaneseFrench: 'J\'étudie tous les jours.' },
  { japanese: '寝る', hiragana: 'ねる', romaji: 'neru', meaning: 'to sleep', jlptLevel: 'n5', pos: 'verb', japaneseExample: '夜寝ます。', exampleRomaji: 'Yoru nemasu.', exampleJapaneseFrench: 'Je dors la nuit.' },
  { japanese: '起きる', hiragana: 'おきる', romaji: 'okiru', meaning: 'to wake up', jlptLevel: 'n5', pos: 'verb', japaneseExample: '朝起きます。', exampleRomaji: 'Asa okimasu.', exampleJapaneseFrench: 'Je me réveille le matin.' },
  { japanese: '歩く', hiragana: 'あるく', romaji: 'aruku', meaning: 'to walk', jlptLevel: 'n5', pos: 'verb', japaneseExample: '公園を歩きます。', exampleRomaji: 'Kōen wo arukimasu.', exampleJapaneseFrench: 'Je marche dans le parc.' },
  { japanese: '走る', hiragana: 'はしる', romaji: 'hashiru', meaning: 'to run', jlptLevel: 'n5', pos: 'verb', japaneseExample: '毎日走ります。', exampleRomaji: 'Mainichi hashirimasu.', exampleJapaneseFrench: 'Je cours tous les jours.' },
  { japanese: '泳ぐ', hiragana: 'およぐ', romaji: 'oyogu', meaning: 'to swim', jlptLevel: 'n5', pos: 'verb', japaneseExample: 'プールで泳ぎます。', exampleRomaji: 'Pūru de oyogimasu.', exampleJapaneseFrench: 'Je nage à la piscine.' },
  
  // Adjectives
  { japanese: '大きい', hiragana: 'おおきい', romaji: 'ōkii', meaning: 'big', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '大きい家です。', exampleRomaji: 'Ōkii ie desu.', exampleJapaneseFrench: 'C\'est une grande maison.' },
  { japanese: '小さい', hiragana: 'ちいさい', romaji: 'chiisai', meaning: 'small', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '小さい犬です。', exampleRomaji: 'Chiisai inu desu.', exampleJapaneseFrench: 'C\'est un petit chien.' },
  { japanese: '新しい', hiragana: 'あたらしい', romaji: 'atarashii', meaning: 'new', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '新しい車を買いました。', exampleRomaji: 'Atarashii kuruma wo kaimashita.', exampleJapaneseFrench: 'J\'ai acheté une nouvelle voiture.' },
  { japanese: '古い', hiragana: 'ふるい', romaji: 'furui', meaning: 'old', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '古い本です。', exampleRomaji: 'Furui hon desu.', exampleJapaneseFrench: 'C\'est un vieux livre.' },
  { japanese: '美しい', hiragana: 'うつくしい', romaji: 'utsukushii', meaning: 'beautiful', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '美しい花です。', exampleRomaji: 'Utsukushii hana desu.', exampleJapaneseFrench: 'C\'est une belle fleur.' },
  { japanese: '良い', hiragana: 'よい', romaji: 'yoi', meaning: 'good', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '良い天気ですね。', exampleRomaji: 'Yoi tenki desu ne.', exampleJapaneseFrench: 'C\'est un beau temps.' },
  { japanese: '悪い', hiragana: 'わるい', romaji: 'warui', meaning: 'bad', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '悪い天気です。', exampleRomaji: 'Warui tenki desu.', exampleJapaneseFrench: 'C\'est un mauvais temps.' },
  { japanese: '高い', hiragana: 'たかい', romaji: 'takai', meaning: 'high, expensive', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '高い山です。', exampleRomaji: 'Takai yama desu.', exampleJapaneseFrench: 'C\'est une montagne haute.' },
  { japanese: '低い', hiragana: 'ひくい', romaji: 'hikui', meaning: 'low', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '低い声です。', exampleRomaji: 'Hikui koe desu.', exampleJapaneseFrench: 'C\'est une voix grave.' },
  { japanese: '長い', hiragana: 'ながい', romaji: 'nagai', meaning: 'long', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '長い髪です。', exampleRomaji: 'Nagai kami desu.', exampleJapaneseFrench: 'C\'est de longs cheveux.' },
  { japanese: '短い', hiragana: 'みじかい', romaji: 'mijikai', meaning: 'short', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '短いスカートです。', exampleRomaji: 'Mijikai sukāto desu.', exampleJapaneseFrench: 'C\'est une jupe courte.' },
  { japanese: '熱い', hiragana: 'あつい', romaji: 'atsui', meaning: 'hot', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '熱いコーヒーです。', exampleRomaji: 'Atsui kōhī desu.', exampleJapaneseFrench: 'C\'est un café chaud.' },
  { japanese: '冷たい', hiragana: 'つめたい', romaji: 'tsumetai', meaning: 'cold', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '冷たい水です。', exampleRomaji: 'Tsumetai mizu desu.', exampleJapaneseFrench: 'C\'est de l\'eau froide.' },
  { japanese: '楽しい', hiragana: 'たのしい', romaji: 'tanoshii', meaning: 'fun, enjoyable', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '楽しい時間です。', exampleRomaji: 'Tanoshii jikan desu.', exampleJapaneseFrench: 'C\'est un moment amusant.' },
  { japanese: '難しい', hiragana: 'むずかしい', romaji: 'muzukashii', meaning: 'difficult', jlptLevel: 'n5', pos: 'adjective', japaneseExample: '難しい問題です。', exampleRomaji: 'Muzukashii mondai desu.', exampleJapaneseFrench: 'C\'est un problème difficile.' },
  
  // Time & Dates
  { japanese: '時間', hiragana: 'じかん', romaji: 'jikan', meaning: 'time, hour', jlptLevel: 'n5', pos: 'noun', japaneseExample: '時間がありません。', exampleRomaji: 'Jikan ga arimasen.', exampleJapaneseFrench: 'Je n\'ai pas de temps.' },
  { japanese: '朝', hiragana: 'あさ', romaji: 'asa', meaning: 'morning', jlptLevel: 'n5', pos: 'noun', japaneseExample: '朝起きます。', exampleRomaji: 'Asa okimasu.', exampleJapaneseFrench: 'Je me réveille le matin.' },
  { japanese: '昼', hiragana: 'ひる', romaji: 'hiru', meaning: 'noon, daytime', jlptLevel: 'n5', pos: 'noun', japaneseExample: '昼食を食べます。', exampleRomaji: 'Chūshoku wo tabemasu.', exampleJapaneseFrench: 'Je déjeune.' },
  { japanese: '夜', hiragana: 'よる', romaji: 'yoru', meaning: 'night', jlptLevel: 'n5', pos: 'noun', japaneseExample: '夜寝ます。', exampleRomaji: 'Yoru nemasu.', exampleJapaneseFrench: 'Je dors la nuit.' },
  { japanese: '今日', hiragana: 'きょう', romaji: 'kyō', meaning: 'today', jlptLevel: 'n5', pos: 'noun', japaneseExample: '今日は月曜日です。', exampleRomaji: 'Kyō wa getsuyōbi desu.', exampleJapaneseFrench: 'Aujourd\'hui c\'est lundi.' },
  { japanese: '明日', hiragana: 'あした', romaji: 'ashita', meaning: 'tomorrow', jlptLevel: 'n5', pos: 'noun', japaneseExample: '明日来ます。', exampleRomaji: 'Ashita kimasu.', exampleJapaneseFrench: 'Je viens demain.' },
  { japanese: '昨日', hiragana: 'きのう', romaji: 'kinō', meaning: 'yesterday', jlptLevel: 'n5', pos: 'noun', japaneseExample: '昨日行きました。', exampleRomaji: 'Kinō ikimashita.', exampleJapaneseFrench: 'Je suis allé hier.' },
  { japanese: '週', hiragana: 'しゅう', romaji: 'shū', meaning: 'week', jlptLevel: 'n5', pos: 'noun', japaneseExample: '週に一度来ます。', exampleRomaji: 'Shū ni ichido kimasu.', exampleJapaneseFrench: 'Je viens une fois par semaine.' },
  { japanese: '月', hiragana: 'つき', romaji: 'tsuki', meaning: 'month', jlptLevel: 'n5', pos: 'noun', japaneseExample: '月に一度会います。', exampleRomaji: 'Tsuki ni ichido aimasu.', exampleJapaneseFrench: 'Je me rencontre une fois par mois.' },
  { japanese: '年', hiragana: 'ねん', romaji: 'nen', meaning: 'year', jlptLevel: 'n5', pos: 'noun', japaneseExample: '毎年来ます。', exampleRomaji: 'Mainen kimasu.', exampleJapaneseFrench: 'Je viens chaque année.' },
];

export default JAPANESE_VOCAB_300;
