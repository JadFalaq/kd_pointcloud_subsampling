const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE";            // 13.33 x 7.5
p.author = "Projet Point Clouds + KD";
p.title = "KD & Robustesse au sous-echantillonnage";

// ---- palette (medical teal / navy) ----
const DARK="08293A", NAVY="0B3C5D", TEAL="1C7293", CYAN="2EC4B6",
      CORAL="E76F51", INK="16323D", MUTE="6B7B84", WHITE="FFFFFF",
      TINT="EAF3F3", TINT2="F2F6F7";
const HF="Cambria", BF="Calibri";
const W=13.33, H=7.5;

// ---- helpers ----
function dotMotif(s, x, y, spread, n, color, maxR){
  for(let i=0;i<n;i++){
    const r = (0.04 + Math.random()*maxR);
    s.addShape(p.ShapeType.ellipse, {x:x+Math.random()*spread, y:y+Math.random()*spread,
      w:r, h:r, fill:{color:color, transparency:20+Math.random()*50}, line:{type:"none"}});
  }
}
function title(s, t){
  s.addText(t, {x:0.6,y:0.42,w:12.1,h:0.9,fontFace:HF,fontSize:32,bold:true,color:NAVY,isTextBox:true,margin:0});
}
function card(s,x,y,w,h,fill){
  s.addShape(p.ShapeType.roundRect,{x,y,w,h,rectRadius:0.09,fill:{color:fill},line:{type:"none"},
    shadow:{type:"outer",color:"9AAEB5",blur:7,offset:2,angle:90,opacity:0.35}});
}
function numCircle(s,x,y,d,num,color){
  s.addShape(p.ShapeType.ellipse,{x,y,w:d,h:d,fill:{color:color},line:{type:"none"}});
  s.addText(String(num),{x,y,w:d,h:d,align:"center",valign:"middle",fontFace:HF,fontSize:18,bold:true,color:WHITE,isTextBox:true,margin:0});
}

// ============== S1 TITLE ==============
let s = p.addSlide(); s.background={color:DARK};
dotMotif(s, 9.7, 0.4, 3.2, 26, CYAN, 0.26);
s.addText("1ʳᵉ moitié du projet",{x:0.7,y:1.35,w:4,h:0.4,fontFace:BF,fontSize:14,bold:true,color:CYAN,
  isTextBox:true,margin:0,charSpacing:2});
s.addText("Distillation de connaissances &\nrobustesse au sous-échantillonnage",
  {x:0.7,y:1.85,w:11.4,h:2.0,fontFace:HF,fontSize:40,bold:true,color:WHITE,isTextBox:true,margin:0,lineSpacingMultiple:1.02});
s.addText("Nuages de points appliqués à l'imagerie médicale — classification de nodules (NoduleMNIST3D)",
  {x:0.7,y:4.0,w:11.0,h:0.7,fontFace:BF,fontSize:18,color:"CFE2E6",isTextBox:true,margin:0});
s.addText("PointNet (teacher / student)  ·  Knowledge Distillation  ·  GPU (RTX 5060)",
  {x:0.7,y:5.1,w:11,h:0.5,fontFace:BF,fontSize:14,color:"9FC2C8",isTextBox:true,margin:0});
s.addNotes("Projet autour des nuages de points en imagerie médicale, focus distillation de connaissances. Sujet imposé: robustesse au sous-échantillonnage pour la classification. Ce deck couvre la première moitié: données, modèles baselines, et le protocole de robustesse.");

// ============== S2 RQ & Hypothesis ==============
s = p.addSlide(); s.background={color:WHITE}; title(s,"Question de recherche");
card(s,0.6,1.6,12.1,1.85,TINT);
s.addText("Q",{x:0.95,y:1.95,w:1.0,h:1.0,align:"center",valign:"middle",fontFace:HF,fontSize:30,bold:true,color:WHITE,
  fill:{color:TEAL},isTextBox:true,margin:0,shape:p.ShapeType.ellipse});
s.addText([{text:"La distillation d'un teacher entraîné sur des nuages ",options:{}},
  {text:"denses",options:{bold:true,color:TEAL}},
  {text:" permet-elle à un student léger d'être plus ",options:{}},
  {text:"robuste au sous-échantillonnage",options:{bold:true,color:TEAL}},
  {text:" des points à l'inférence, pour la classification de nodules pulmonaires ?",options:{}}],
  {x:2.25,y:1.72,w:10.1,h:1.6,fontFace:BF,fontSize:20,color:INK,valign:"middle",isTextBox:true,margin:0,lineSpacingMultiple:1.08});
card(s,0.6,3.75,12.1,1.7,TINT2);
s.addText("H1",{x:0.95,y:4.05,w:1.0,h:1.0,align:"center",valign:"middle",fontFace:HF,fontSize:26,bold:true,color:WHITE,
  fill:{color:CORAL},isTextBox:true,margin:0,shape:p.ShapeType.ellipse});
s.addText([{text:"Hypothèse.  ",options:{bold:true,color:CORAL}},
  {text:"Un student ",options:{}},{text:"distillé",options:{bold:true}},
  {text:" se dégrade plus gracieusement quand on retire des points en test qu'un student entraîné ",options:{}},
  {text:"from scratch",options:{italic:true}},{text:" (cross-entropy seule), à capacité égale.",options:{}}],
  {x:2.25,y:3.87,w:10.1,h:1.46,fontFace:BF,fontSize:18,color:INK,valign:"middle",isTextBox:true,margin:0,lineSpacingMultiple:1.08});
s.addText("Condition imposée : données médicales · dataset & architectures libres (à justifier).",
  {x:0.6,y:5.7,w:12.1,h:0.4,fontFace:BF,fontSize:13,italic:true,color:MUTE,isTextBox:true,margin:0});
s.addNotes("La question porte sur un bénéfice précis de la KD: non pas la précision brute, mais la robustesse quand le nuage de points devient parcimonieux. H1 compare student distillé vs student from scratch.");

// ============== S3 Dataset ==============
s = p.addSlide(); s.background={color:WHITE}; title(s,"Données — NoduleMNIST3D (MedMNIST v2)");
const stats=[["1 633","volumes CT (1158/165/310)"],["28³","voxels par volume"],["~25 %","nodules malins (déséquilibré)"],["binaire","bénin vs malin"]];
let sx=0.6; const sw=2.95, gap=0.18;
stats.forEach((st,i)=>{ const x=sx+i*(sw+gap); card(s,x,1.65,sw,1.5,i%2?TINT2:TINT);
  s.addText(st[0],{x:x,y:1.8,w:sw,h:0.8,align:"center",fontFace:HF,fontSize:34,bold:true,color:i%2?CORAL:TEAL,isTextBox:true,margin:0});
  s.addText(st[1],{x:x+0.15,y:2.6,w:sw-0.3,h:0.5,align:"center",fontFace:BF,fontSize:12.5,color:MUTE,isTextBox:true,margin:0});});
s.addText("Pourquoi ce jeu de données",{x:0.6,y:3.5,w:11,h:0.4,fontFace:HF,fontSize:18,bold:true,color:NAVY,isTextBox:true,margin:0});
const why=["Médical & public (condition imposée), licence ouverte",
  "Léger → budget laptop-GPU : on peut entraîner teacher + student + variantes KD",
  "Convertible en nuages de points : échantillonnage de voxels pondéré par l'intensité → (x, y, z, intensité)",
  "Idéal pour le sous-échantillonnage : nuage dense 1024 pts, puis on retire des points au test"];
s.addText(why.map((t,i)=>({text:t,options:{bullet:{code:"2022",indent:18},breakLine:true,paraSpaceAfter:7}})),
  {x:0.7,y:4.0,w:12.0,h:2.6,fontFace:BF,fontSize:15.5,color:INK,isTextBox:true,margin:0});
s.addNotes("NoduleMNIST3D: petit, public, médical. On le transforme en nuages de points. Déséquilibre ~1:4 → on rapporte AUC et balanced-accuracy, pas l'accuracy brute, et on pondère la loss.");

// ============== S4 Volumes -> clouds ==============
s = p.addSlide(); s.background={color:WHITE}; title(s,"Des volumes CT aux nuages de points");
const steps=[["Volume 28³","intensités CT (0–255)"],["Échantillonnage","voxels pondérés par l'intensité"],
  ["Nuage dense","1024 pts · (x, y, z, I)"],["Sous-échantillonnage","on garde N points au test"]];
const cw=2.9, cgap=0.25; let cx0=0.6;
steps.forEach((st,i)=>{ const x=cx0+i*(cw+cgap); card(s,x,1.9,cw,2.5,TINT2);
  numCircle(s,x+cw/2-0.33,2.15,0.66,i+1,i<3?TEAL:CORAL);
  s.addText(st[0],{x:x+0.1,y:3.0,w:cw-0.2,h:0.5,align:"center",fontFace:HF,fontSize:17,bold:true,color:NAVY,isTextBox:true,margin:0});
  s.addText(st[1],{x:x+0.15,y:3.5,w:cw-0.3,h:0.8,align:"center",fontFace:BF,fontSize:13,color:MUTE,isTextBox:true,margin:0});
  if(i<3) s.addText("→",{x:x+cw-0.02,y:2.9,w:0.3,h:0.6,align:"center",valign:"middle",fontFace:BF,fontSize:26,bold:true,color:CYAN,isTextBox:true,margin:0});});
dotMotif(s,5.6,4.85,2.0,24,TEAL,0.14);
s.addText("Chaque nodule devient un nuage de points : coordonnées centrées et mises à l'échelle (boule unité), intensité en 4ᵉ canal.",
  {x:0.6,y:5.9,w:12.1,h:0.6,align:"center",fontFace:BF,fontSize:14,italic:true,color:MUTE,isTextBox:true,margin:0});
s.addNotes("Pipeline de conversion. On échantillonne les voxels pondérés par l'intensité pour concentrer les points sur la structure du nodule. Le protocole de robustesse retire ensuite des points d'un nuage dense fixe.");

// ============== S5 Architectures ==============
s = p.addSlide(); s.background={color:WHITE}; title(s,"Architectures — PointNet (teacher / student)");
function archCard(x,color,name,params,emb,role){
  card(s,x,1.7,5.9,2.9,TINT);
  s.addShape(p.ShapeType.roundRect,{x:x,y:1.7,w:5.9,h:0.75,rectRadius:0.09,fill:{color:color},line:{type:"none"}});
  s.addText(name,{x:x+0.3,y:1.7,w:5.3,h:0.75,valign:"middle",fontFace:HF,fontSize:20,bold:true,color:WHITE,isTextBox:true,margin:0});
  s.addText(params,{x:x+0.3,y:2.65,w:5.3,h:0.9,fontFace:HF,fontSize:40,bold:true,color:color,isTextBox:true,margin:0});
  s.addText(role,{x:x+0.3,y:3.6,w:5.3,h:0.9,fontFace:BF,fontSize:14,color:INK,isTextBox:true,margin:0,lineSpacingMultiple:1.05});
}
archCard(0.6,TEAL,"Teacher","0.8 M params","1024","emb 1024 · haute capacité ·\nentraîné sur nuages denses");
archCard(6.83,CORAL,"Student","54 k params","256","emb 256 · ~15× plus léger ·\nle modèle qu'on veut rendre robuste");
s.addText([{text:"Pourquoi PointNet : ",options:{bold:true,color:NAVY}},
  {text:"classifieur canonique, invariant par permutation ; son max-pooling global unique rend la robustesse au sous-échantillonnage facile à analyser ; assez léger pour teacher + student + variantes KD. (DGCNN / Point Transformer = extensions plus lourdes possibles.)",options:{}}],
  {x:0.6,y:4.85,w:12.1,h:1.6,fontFace:BF,fontSize:15,color:INK,isTextBox:true,margin:0,lineSpacingMultiple:1.08});
s.addNotes("PointNet pour teacher et student, largeur scalable. Le choix est justifié par la simplicité, l'invariance par permutation, et surtout le max-pool global qui rend l'analyse de robustesse limpide.");

// ============== S6 Protocol ==============
s = p.addSlide(); s.background={color:WHITE}; title(s,"Protocole — robustesse au sous-échantillonnage");
const prot=["Entraîner sur les nuages denses (1024 points, légère augmentation par jitter)",
  "Au test : garder un sous-ensemble aléatoire de N points du même nuage",
  "N ∈ {1024, 512, 256, 128, 64, 32, 16} — on retire de plus en plus de points",
  "Mesurer l'AUC à chaque N → la courbe de robustesse"];
prot.forEach((t,i)=>{ const y=1.7+i*0.92; numCircle(s,0.7,y,0.6,i+1,NAVY);
  s.addText(t,{x:1.5,y:y,w:7.4,h:0.6,valign:"middle",fontFace:BF,fontSize:15.5,color:INK,isTextBox:true,margin:0});});
// sparsity visual: three clusters thinning
const vx=[9.4,10.7,12.0], vn=[40,16,5], vlab=["1024","128","16"];
vx.forEach((x,i)=>{ card(s,x-0.15,2.2,1.15,1.15,TINT2); dotMotif(s,x-0.05,2.3,0.9,vn[i],TEAL,0.09);
  s.addText(vlab[i]+" pts",{x:x-0.25,y:3.42,w:1.35,h:0.35,align:"center",fontFace:BF,fontSize:12,bold:true,color:MUTE,isTextBox:true,margin:0});});
s.addText("← de plus en plus parcimonieux",{x:9.2,y:3.9,w:3.4,h:0.4,align:"center",fontFace:BF,fontSize:12,italic:true,color:CORAL,isTextBox:true,margin:0});
s.addNotes("Protocole standard de robustesse: on construit un nuage dense fixe puis on en retire des points au test. On mesure l'AUC à chaque densité.");

// ============== S7 Results chart ==============
s = p.addSlide(); s.background={color:WHITE}; title(s,"Résultats — courbes de robustesse (AUC test)");
const cats=["1024","512","256","128","64","32","16"];
const teach=[0.791,0.776,0.773,0.726,0.708,0.667,0.572];
const stud =[0.810,0.785,0.779,0.731,0.677,0.616,0.568];
s.addChart(p.ChartType.line,[
  {name:"Teacher (0.8M)",labels:cats,values:teach},
  {name:"Student scratch (54k)",labels:cats,values:stud}],
  {x:0.6,y:1.55,w:8.1,h:5.3,showTitle:false,showLegend:true,legendPos:"b",legendFontFace:BF,legendFontSize:12,
   chartColors:[TEAL,CORAL],lineSize:3,lineDataSymbol:"circle",lineDataSymbolSize:7,
   valAxisMinVal:0.5,valAxisMaxVal:0.85,valAxisMajorUnit:0.05,
   catAxisTitle:"# points à l'inférence (→ plus parcimonieux)",showCatAxisTitle:true,catAxisTitleColor:MUTE,catAxisTitleFontSize:11,catAxisTitleFontFace:BF,
   valAxisTitle:"ROC-AUC",showValAxisTitle:true,valAxisTitleColor:MUTE,valAxisTitleFontSize:11,valAxisTitleFontFace:BF,
   catAxisLabelColor:MUTE,valAxisLabelColor:MUTE,catAxisLabelFontSize:11,valAxisLabelFontSize:11,
   catAxisLabelFontFace:BF,valAxisLabelFontFace:BF,
   valGridLine:{color:"E6ECEF",size:1},catGridLine:{style:"none"}});
card(s,8.95,1.7,3.75,5.0,DARK);
s.addText("À retenir",{x:9.2,y:1.95,w:3.3,h:0.4,fontFace:HF,fontSize:17,bold:true,color:CYAN,isTextBox:true,margin:0});
const ins=["Les deux modèles chutent : AUC 0.80 → 0.57 quand on passe de 1024 à 16 points.",
  "Le student (54k) égale le teacher (0.8M) à pleine densité.",
  "Mais le teacher reste meilleur en sparsité extrême (64 pts : 0.708 vs 0.677)."];
s.addText(ins.map(t=>({text:t,options:{bullet:{code:"2022",indent:16},breakLine:true,paraSpaceAfter:11,color:"E6F2F3"}})),
  {x:9.3,y:2.5,w:3.25,h:4.0,fontFace:BF,fontSize:13,isTextBox:true,margin:0,lineSpacingMultiple:1.05});
s.addNotes("Courbe de robustesse. Deux observations clés: le petit student est compétitif à pleine densité, mais le teacher se dégrade plus gracieusement en sous-échantillonnage extrême. C'est exactement ce que la KD pourrait transférer.");

// ============== S8 Critical analysis ==============
s = p.addSlide(); s.background={color:WHITE}; title(s,"Analyse critique");
const find=[["Le phénomène est réel","L'AUC chute de ~0.80 (1024 pts) à ~0.57 (16 pts) pour les deux modèles — terrain de jeu idéal pour la KD.",TEAL],
  ["Surprise honnête","Le student 54k égale/dépasse le teacher 0.8M à pleine densité : dataset petit & difficile, la capacité du teacher n'aide pas (sur-apprentissage).",CORAL],
  ["Le vrai signal pour la KD","Le teacher se dégrade plus gracieusement en sparsité extrême. On recadre H1 : la KD ne vise pas la précision mais la robustesse basse-densité.",NAVY]];
find.forEach((f,i)=>{ const y=1.65+i*1.62; card(s,0.6,y,12.1,1.45,i==1?TINT2:TINT);
  s.addText((i+1),{x:0.95,y:y+0.28,w:0.9,h:0.9,align:"center",valign:"middle",fontFace:HF,fontSize:30,bold:true,color:f[2],isTextBox:true,margin:0});
  s.addText(f[0],{x:2.0,y:y+0.17,w:10.4,h:0.5,fontFace:HF,fontSize:18,bold:true,color:INK,isTextBox:true,margin:0});
  s.addText(f[1],{x:2.0,y:y+0.65,w:10.5,h:0.72,fontFace:BF,fontSize:14,color:"33474F",isTextBox:true,margin:0,lineSpacingMultiple:1.03});});
s.addNotes("Analyse honnête incluant le résultat inattendu (student ~ teacher). Le point important: le teacher est plus robuste en sparsité, ce qui motive et recadre l'hypothèse de KD.");

// ============== S9 Second half ==============
s = p.addSlide(); s.background={color:WHITE}; title(s,"Deuxième moitié — la distillation");
const kd=[["KD logit (Hinton)","α·CE + (1-α)·KL(z_s/T ‖ z_t/T), teacher gelé"],
  ["KD robuste (idée originale)","teacher voit le nuage dense, student voit un nuage sous-échantillonné → apprend la sparsité"],
  ["KD de features","aligner le vecteur global g (déjà exposé par le modèle)"],
  ["Comparaison & test de H1","courbes student_KD vs scratch vs teacher ; conclure (même si H1 infirmée)"]];
kd.forEach((k,i)=>{ const x=0.6+(i%2)*6.2, y=1.7+Math.floor(i/2)*2.35; card(s,x,y,5.9,2.05,i<2?TINT:TINT2);
  numCircle(s,x+0.3,y+0.3,0.62,i+1,i<2?TEAL:CORAL);
  s.addText(k[0],{x:x+1.1,y:y+0.32,w:4.6,h:0.6,valign:"middle",fontFace:HF,fontSize:16.5,bold:true,color:NAVY,isTextBox:true,margin:0});
  s.addText(k[1],{x:x+0.35,y:y+1.05,w:5.2,h:0.9,fontFace:BF,fontSize:13.5,color:INK,isTextBox:true,margin:0,lineSpacingMultiple:1.05});});
s.addNotes("Plan concret de la suite, branché sur le code existant. L'idée originale: KD robuste où le student apprend à reproduire la sortie dense du teacher à partir d'un nuage parcimonieux.");

// ============== S10 Conclusion ==============
s = p.addSlide(); s.background={color:DARK};
dotMotif(s,0.3,4.3,3.0,22,TEAL,0.22);
s.addText("Conclusion",{x:0.7,y:0.9,w:11,h:0.9,fontFace:HF,fontSize:34,bold:true,color:WHITE,isTextBox:true,margin:0});
const concl=["Infrastructure complète + baselines établies : données → nuages de points, teacher, student, protocole de robustesse.",
  "Le sous-échantillonnage dégrade nettement la classification (AUC 0.80 → 0.57) — mesurable et reproductible.",
  "H1 recadrée honnêtement : la KD doit transférer la robustesse basse-densité, pas la précision.",
  "Prochaine étape : implémenter la KD (logit / robuste / features) et comparer les courbes."];
s.addText(concl.map(t=>({text:t,options:{bullet:{code:"2022",indent:20},breakLine:true,paraSpaceAfter:13,color:"E6F2F3"}})),
  {x:0.75,y:2.1,w:11.7,h:3.8,fontFace:BF,fontSize:17,isTextBox:true,margin:0,lineSpacingMultiple:1.06});
s.addText("Code reproductible : src/ · run_half.py · notebooks/01_pointclouds_robustness.ipynb",
  {x:0.75,y:6.55,w:12,h:0.5,fontFace:BF,fontSize:13,color:"9FC2C8",isTextBox:true,margin:0});
s.addNotes("Résumé: la moitié du projet livre toute l'infrastructure et les baselines. Le phénomène de robustesse est établi, l'hypothèse recadrée, et la KD est la suite.");

p.writeFile({fileName:"KD_pointcloud_presentation.pptx"}).then(f=>console.log("wrote",f));
