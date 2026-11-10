/* ybs.js — YBS guide: routes, filters, rain check, traffic estimate */
(function () {
  "use strict";

  /* ---------- Settings (edit here) ---------- */
  var DEFAULT_OPEN = "05:00";   // typical first bus
  var DEFAULT_CLOSE = "21:00";  // typical last bus
  var LAT = 16.8409, LON = 96.1735; // Yangon

  /* City-side gate groups = colors */
  var GROUPS = {
    sule:       { name: "Sule (City Hall)", my: "ဆူးလေ",       color: "#e53935" },
    thakhin:    { name: "Thakhin Mya Park", my: "သခင်မြပန်းခြံ",        color: "#1e88e5" },
    botahtaung: { name: "Botahtaung", my: "ဗိုလ်တထောင်",              color: "#2e9e4f" },
    pabedan:    { name: "Pabedan / Merchant Rd", my: "ပန်းဆိုးတန်း / ကုန်သည်လမ်း",   color: "#fb8c00" },
    latha:      { name: "Latha", my: "လသာ",                   color: "#8e24aa" },
    linsa:      { name: "Linsadaung", my: "လင်းစဒေါင်း",              color: "#00acc1" },
    railway:    { name: "Central Railway Station", my: "ဘူတာကြီး", color: "#6d4c41" },
    insein:     { name: "Insein Park", my: "အင်းစိန်ပန်းခြံ",             color: "#d81b60" },
    loop:       { name: "Downtown loop", my: "မြို့တွင်းပတ်လမ်း",           color: "#3949ab" },
    air:        { name: "Airport", my: "လေဆိပ်",                 color: "#212121" },
    other:      { name: "Other / outer routes", my: "အခြား / ပြင်ပလမ်းကြောင်းများ",    color: "#607d8b" }
  };

  /* [number, variant, Burmese gate A, Burmese gate B, English gate A, English gate B, group, is24h] */
  var R = [
    ["1","","လှည်းကူးဈေး","ဇဝန","Hlegu Market","Zawana","other"],
    ["2","","ပိတောက်ကွေ့","အောင်မင်္ဂလာအဝေးပြေး","Padauk Kway","Aung Mingalar Highway","other"],
    ["3","","အဝိုင်းထိပ် (ကွန်တိန်နာဂိတ်)","ဆူးလေမြို့တော်ခန်းမ","Awaing Htate (Container Gate)","Sule (City Hall)","sule"],
    ["4","","ရတနာနှင်းဆီအိမ်ရာ","ဗိုလ်ချုပ်စျေး","Yadanar Hnin Si Housing","Bogyoke Market","other"],
    ["5","","ရိုးမရိပ်သာ","ဗိုလ်ချုပ်အောင်ဆန်းလမ်း","Yoma Yeik Thar","Bogyoke Aung San Rd","other"],
    ["6","","၈၉ လမ်းဆုံ (ကနောင်မင်းသားကြီးလမ်း)","ဒဂုံဧရာအဝေးပြေး","89 St Junction (Kanaung Min Thar Gyi Rd)","Dagon Ayeyar Highway","other"],
    ["7","Nat Sin","အောင်မြင့်မိုရ်အိမ်ရာ (ရတနာပုံလမ်း)","ပန်းဆိုးတန်း","Aung Myin Mor Housing","Pabedan","pabedan"],
    ["7","Industrial Zone","အောင်မြင့်မိုရ်အိမ်ရာ (ရတနာပုံလမ်း)","ပန်းဆိုးတန်း","Aung Myin Mor Housing","Pabedan","pabedan"],
    ["8","","ရိုးမရိပ်သာ","လသာ","Yoma Yeik Thar","Latha","latha"],
    ["9","Ward 87","ဒဂုံဆိပ်ကမ်း (၈၇) ရပ်ကွက်","ကျောက်တိုင်","Dagon Seikkan (Ward 87)","Kyauktaing","other"],
    ["9","NYRDDC","တိုင်းရင်းသား နည်းပညာတက္ကသိုလ်","ကျောက်တိုင်","Ethnic Technology University","Kyauktaing","other"],
    ["10","","တိုင်းရင်းသားကျေးရွာ","ဒဂုံတက္ကသိုလ်","National Races Village","Dagon University","other"],
    ["11","","အောင်မင်္ဂလာအဝေးပြေး","ရွှေတိဂုံဘုရား","Aung Mingalar Highway","Shwedagon Pagoda","other"],
    ["12","","အရှေ့ဒဂုံ","ဆူးလေ","East Dagon","Sule","sule"],
    ["13","","ဒဂုံတက္ကသိုလ်","ဗိုလ်တထောင်ဘုရား","Dagon University","Botahtaung Pagoda","botahtaung"],
    ["14","","ပါရမီ (ညောင်ပင်)","သခင်မြပန်းခြံ","Parami (Nyaung Pin)","Thakhin Mya Park","thakhin"],
    ["15","","ဒဂုံတက္ကသိုလ်","ဒညင်းကုန်းလမ်းဆုံ","Dagon University","Danyingone Junction","other"],
    ["16","","ရွှေပေါက်ကံ","ဒဂုံဧရာအဝေးပြေးဝင်း","Shwe Pauk Kan","Dagon Ayeyar Highway","other"],
    ["17","","ရွှေပေါက်ကံ","ဒဂုံဧရာအဝေးပြေးဝင်း","Shwe Pauk Kan","Dagon Ayeyar Highway","other"],
    ["18","","ထောက်ကြန့်","ယဥ်ကျေးမှုတက္ကသိုလ်","Htauk Kyant","University of Culture","other"],
    ["19","","ရွှေပေါက်ကံ","သခင်မြပန်းခြံ","Shwe Pauk Kan","Thakhin Mya Park","thakhin"],
    ["20","","ဒဂုံဧရာအဝေးပြေးဝင်း","သခင်မြပန်းခြံ","Dagon Ayeyar Highway","Thakhin Mya Park","thakhin",true],
    ["21","","ရန်ကုန်အနောက်ပိုင်းတက္ကသိုလ်","လသာ","West Yangon University","Latha","latha"],
    ["22","","ရန်ကုန်အနောက်ပိုင်းတက္ကသိုလ်","သခင်မြပန်းခြံ","West Yangon University","Thakhin Mya Park","thakhin"],
    ["23","","အနောက်ပိုင်းနည်းပညာတက္ကသိုလ်","သခင်မြပန်းခြံ","West Technological University","Thakhin Mya Park","thakhin"],
    ["24","","ဒဂုံတက္ကသိုလ်","ဗိုလ်တထောင်ဘုရား","Dagon University","Botahtaung Pagoda","botahtaung"],
    ["25","","ဒဂုံတက္ကသိုလ်","ဘိုကလေးစျေး","Dagon University","Bogalay Market","other"],
    ["26","","ဒဂုံတက္ကသိုလ်","ဗိုလ်တထောင်ဘုရား","Dagon University","Botahtaung Pagoda","botahtaung"],
    ["27","","သုခဒဂုံအိမ်ရာ","ယုဇနပလာဇာ","Thukha Dagon Housing","Yuzana Plaza","other"],
    ["28","","ဒဂုံတက္ကသိုလ်","ဆူးလေမြို့တော်ခန်းမ","Dagon University","Sule (City Hall)","sule"],
    ["29","","ရွှေပေါက်ကံတံတားထိပ်","ဆူးလေမြို့တော်ခန်းမ","Shwe Pauk Kan Bridge","Sule (City Hall)","sule"],
    ["30","","ဒဂုံတက္ကသိုလ်","သခင်မြပန်းခြံ","Dagon University","Thakhin Mya Park","thakhin"],
    ["31","","အရှေ့ပိုင်းတက္ကသိုလ်","ပန်းဆိုးတန်း (ကုန်သည်လမ်း)","East Yangon University","Pabedan (Merchant Rd)","pabedan"],
    ["31","Thilawa Housing","သီလဝါအိမ်ရာ","ပန်းဆိုးတန်း (ကုန်သည်လမ်း)","Thilawa Housing","Pabedan (Merchant Rd)","pabedan"],
    ["32","","ရေကြောင်းတက္ကသိုလ်","ထောက်ကြန့်","Myanmar Maritime University","Htauk Kyant","other"],
    ["33","","ကျောက်တန်း","အလုပ်သမားဆေးရုံကြီး","Kyauktan","Workers' Hospital","other"],
    ["34","Kayan","ခရမ်း","ဗိုလ်တထောင်ဘုရား","Kayan","Botahtaung Pagoda","botahtaung"],
    ["34","Thone Gwa","သုံးခွ","ဗိုလ်တထောင်ဘုရား","Thone Gwa","Botahtaung Pagoda","botahtaung"],
    ["35","","ထောက်ကြန့်မြို့ရှောင်လမ်း","မော်တင်","Htauk Kyant Bypass","Mawtin","other"],
    ["36","","တံတားဖြူ (ရွှေပေါက်ကံ)","ဆူးလေမြို့တော်ခန်းမ","Tadar Phyu (Shwe Pauk Kan)","Sule (City Hall)","sule"],
    ["37","","ထောက်ကြန့်","ဆူးလေ","Htauk Kyant","Sule","sule"],
    ["38","","ပါရမီ (ညောင်ပင်)","သီရီမင်္ဂလာစျေးသစ်","Parami (Nyaung Pin)","Thiri Mingalar New Market","other"],
    ["39","","ဝါးတရာ (လှော်ကားလမ်း)","လသာ","Wa Tayar (Hlaw Kar Rd)","Latha","latha"],
    ["40","","ရွှေပြည်သာ","သခင်မြပန်းခြံ","Shwepyitha","Thakhin Mya Park","thakhin"],
    ["41","","မှော်ဘီ","သခင်မြပန်းခြံ","Hmawbi","Thakhin Mya Park","thakhin"],
    ["42","","ရွှေပြည်သာ (သာဓုကန်)","သာကေတ","Shwepyitha (Thadukan)","Thaketa","other"],
    ["43","","ဝါယာလက်","ဗိုလ်တထောင်ဘုရား","Wireless","Botahtaung Pagoda","botahtaung"],
    ["44","","လိန်ကုန်း","လှည်းကူးဈေးရှေ့","Lein Kone","Hlegu Market","other"],
    ["45","","ဖောင်ကြီး (မင်းကုန်းစျေး)","လှည်းကူးစျေး","Hpaung Gyi (Minkone Market)","Hlegu Market","other"],
    ["46","","ကမ်းနား (ဒါးပိန်လမ်း)","ဇဝန","Kanner (Dabein Rd)","Zawana","other"],
    ["52","","ထန်းထပင်","လှိုင်သာယာ (မီးခွက်စျေး)","Htan Tapin","Hlaing Thar Yar (Mee Khwat Market)","other"],
    ["53","Meekwet Zay","အလယ်ရွာ","လှိုင်သာယာ (မီးခွက်စျေး)","Ale Ywa","Hlaing Thar Yar (Mee Khwat Market)","other"],
    ["53","Yone Shay","ရွှေလင်ပန်းလမ်းဆုံ","လှိုင်သာယာ (ရုံးရှေ့)","Shwe Linpan Junction","Hlaing Thar Yar (Office)","other"],
    ["55","","ပါရမီညောင်ကင်","သခင်မြပန်းခြံ","Parami Nyaung Kin","Thakhin Mya Park","thakhin"],
    ["56","Downtown loop","မြို့တွင်း","မြို့တွင်း","Downtown loop","Downtown loop","loop",true],
    ["57","Downtown loop (Botahtaung Pagoda Rd)","မြို့တွင်း","မြို့တွင်း","Downtown loop","Downtown loop","loop"],
    ["58","Downtown loop (Linsadaung)","မြို့တွင်း","မြို့တွင်း","Downtown loop","Downtown loop","loop"],
    ["59","","တောင်ဒဂုံ (၇၁ ရပ်ကွက်)","ဗဟိုအမျိုးသမီးဆေးရုံ","South Dagon (Ward 71)","Central Women's Hospital","other"],
    ["60","","ယုဇနအိမ်ယာ","သီရိမင်္ဂလာဈေးသစ်","Yuzana Housing","Thiri Mingalar New Market","other"],
    ["60","Mini Bus","သာကေတ (၆၅ ရပ်ကွက်)","သီရိမင်္ဂလာဈေးသစ်","Thaketa (Ward 65)","Thiri Mingalar New Market","other"],
    ["61","","အနောက်ပိုင်းနည်းပညာတက္ကသိုလ်","ဆူးလေမြို့တော်ခန်းမ","West Technological University","Sule (City Hall)","sule"],
    ["62","","ဒဂုံတက္ကသိုလ်","ကြည့်မြင်တိုင်ညစျေး","Dagon University","Kyimyindaing Night Market","other"],
    ["63","","ကျောက်ကုန်းထိပ်","ဗိုလ်တထောင်ဘုရား","Kyaukkone Htate","Botahtaung Pagoda","botahtaung"],
    ["64","Thu Dhamma Rd","ဝေဘာဂီ","ပန်းဆိုးတန်း","Webargi","Pabedan","pabedan"],
    ["64","Khe Mar Thi Rd","ဝေဘာဂီ","ပန်းဆိုးတန်း","Webargi","Pabedan","pabedan"],
    ["65","","လှော်ကား","ဗိုလ်တထောင်ဘုရား","Hlaw Kar","Botahtaung Pagoda","botahtaung"],
    ["66","","စိတ်ကျန်းမာရေးဆေးရုံ","ကွန်ပြူတာတက္ကသိုလ်","Mental Health Hospital","Computer University","other"],
    ["67","","ရွှေလင်ပန်း","ညောင်ပင်ရွာ","Shwe Linpan","Nyaung Pin Village","other"],
    ["68","","ရွှေပြည်သာ","အနောက်ပိုင်းနည်းပညာတက္ကသိုလ်","Shwepyitha","West Technological University","other"],
    ["70","","သီလဝါဥယျာဉ်အိမ်ရာ","ပန်းဆိုးတန်း","Thilawa Garden Housing","Pabedan","pabedan"],
    ["70","Mini Bus","သန်လျင်ကျောက်တန်း","ပန်းဆိုးတန်း","Thanlyin Kyauktan","Pabedan","pabedan"],
    ["71","","မြန်မာ့သားကောင်းအိမ်ရာ","ဇဝန","Myanmar Thar Kaung Housing","Zawana","other"],
    ["72","","သာကေတ","ဆူးလေမြို့တော်ခန်းမ","Thaketa","Sule (City Hall)","sule"],
    ["74","","ရွှေပြည်သာ","ဒဂုံဧရာအဝေးပြေး","Shwepyitha","Dagon Ayeyar Highway","other"],
    ["75","","ပင်လုံအိမ်ရာ","ကြည့်မြင်တိုင်","Pinlon Housing","Kyimyindaing","other"],
    ["76","","အရှေ့ပိုင်းတက္ကသိုလ်","မင်းဓမ္မ","East Yangon University","Min Dhamma","other"],
    ["77","","ရွှေပြည်သာ","ရွှေတိဂုံဘုရားလမ်း","Shwepyitha","Shwedagon Pagoda Rd","other"],
    ["78","","ကွန်ပြူတာတက္ကသိုလ်","ရန်ကုန်ဘူတာကြီး","Computer University","Yangon Central Railway Station","railway"],
    ["79","","အနောက်ပိုင်းတက္ကသိုလ်","လင်းစဒေါင်း","West Yangon University","Linsadaung","linsa"],
    ["81","","သုခဒဂုံအိမ်ရာ","ကုန်သည်လမ်း","Thukha Dagon Housing","Merchant Rd","pabedan"],
    ["82","","ဒဂုံဧရာအဝေးပြေး","ဗိုလ်တထောင်ဘုရား","Dagon Ayeyar Highway","Botahtaung Pagoda","botahtaung",true],
    ["83","","ဒဂုံဧရာအဝေးပြေး","ရတနာနှင်းဆီအိမ်ရာ","Dagon Ayeyar Highway","Yadanar Hnin Si Housing","other",true],
    ["84","","သာကေတ","မြောက်ဒဂုံ","Thaketa","North Dagon","other"],
    ["85","","လှိုင်သာယာ (တူးချောင်း)","သာကေတအဝိုင်း","Hlaing Thar Yar (Tu Chaung)","Thaketa Circle","other"],
    ["86","","လှိုင်သာယာ","ညောင်တန်း","Hlaing Thar Yar","Nyaung Tan","other"],
    ["87","","ဒဂုံတက္ကသိုလ်","ဆူးလေ","Dagon University","Sule","sule"],
    ["88","","ဒဂုံတက္ကသိုလ်","တညင်းကုန်းလမ်းဆုံ","Dagon University","Danyingone Junction","other"],
    ["89","Min Nanda Rd","","","Min Nanda Rd route","(see route stops)","other"],
    ["89","Myin Taw Thar Rd","ဧရာဝဏ်","ပန်းပင်ကြီး","Ayarwon","Pan Pin Gyi","other"],
    ["89","National Cancer Institute","အမျိုးသားကင်ဆာဌာန","အောက်ကွေ့","National Cancer Institute","Auk Kwe","other"],
    ["90","","တိုက်ကြီး","သခင်မြပန်းခြံ","Taikkyi","Thakhin Mya Park","thakhin"],
    ["91","","တိုက်ကြီး","အင်းစိန်ပန်းခြံ","Taikkyi","Insein Park","insein"],
    ["92","","ထောက်ကြန့်မြို့ရှောင်လမ်း","ဇဝန","Htauk Kyant Bypass","Zawana","other"],
    ["93","","အနောက်ပိုင်းတက္ကသိုလ်","ရန်ကုန်ဘူတာကြီး","West Yangon University","Yangon Central Railway Station","railway"],
    ["94","","ကွန်ပြူတာတက္ကသိုလ်","ရန်ကုန်ဘူတာကြီး","Computer University","Yangon Central Railway Station","railway"],
    ["95","","ကျောက်တန်း","ဗဟန်းသုံးလမ်း","Kyauktan","Bahan Thone Lan","other"],
    ["96","","လှော်ကားတာဆုံ","သာကေတ","Hlaw Kar Ta Zone","Thaketa","other"],
    ["97","","စီးပွားရေးတက္ကသိုလ်","ထောက်ကြန့်","University of Economics","Htauk Kyant","other"],
    ["98","","ဒဂုံဧရာအဝေးပြေး","ဗိုလ်တထောင် (အထက်ကြည့်မြင်တိုင်လမ်း)","Dagon Ayeyar Highway","Botahtaung (Upper Kyimyindaing Rd)","botahtaung",true],
    ["99","","ဒဂုံဧရာအဝေးပြေး","ရွှေလီလမ်း","Dagon Ayeyar Highway","Shwe Li Rd","other",true],
    ["100","","တောင်ဒဂုံ","လင်းစဒေါင်း","South Dagon","Linsadaung","linsa"],
    ["103","","တောင်ဒဂုံ (ကျီစု)","ဒဂုံဧရာအဝေးပြေး","South Dagon (Kyi Su)","Dagon Ayeyar Highway","other"],
    ["104","","ဝါယာလက်","ဆူးလေ","Wireless","Sule","sule"],
    ["105","","မှော်ဘီဂျီတီစီ","ဆူးလေ","Hmawbi GTC","Sule","sule"],
    ["106","","ဥက္ကံ","စိန်ဂျွန်း","Okkan","Sein Gyun","other"],
    ["107","","လှည်းကူး","ဆူးလေ","Hlegu","Sule","sule"],
    ["108","","ဒဂုံတက္ကသိုလ်","ဆူးလေ","Dagon University","Sule","sule"],
    ["109","","မှော်ဘီဂျီတီစီ","အင်းစိန်ပန်းခြံ","Hmawbi GTC","Insein Park","insein"],
    ["110","","ယုဇနဥယျာဉ်မြို့တော်","ဆူးလေ","Yuzana Garden City","Sule","sule"],
    ["111","Industrial Zone","တောင်ဒဂုံ","ပန်းဆိုးတန်း","South Dagon","Pabedan","pabedan"],
    ["111","Nat Sin","တောင်ဒဂုံ","ပန်းဆိုးတန်း","South Dagon","Pabedan","pabedan"],
    ["112","","အောင်မြင့်မိုရ်အိမ်ရာ","ပန်းဆိုးတန်း","Aung Myin Mor Housing","Pabedan","pabedan"],
    ["113","","ကားကြီးဂိတ်","ဆူးလေမြို့တော်ခန်းမ","Car Gyi Gate","Sule (City Hall)","sule"],
    ["114","","တောင်ဒဂုံ","ဗိုလ်တထောင်ဘုရား","South Dagon","Botahtaung Pagoda","botahtaung"],
    ["115","","အောင်မင်္ဂလာအဝေးပြေး","ဆူးလေမြို့တော်ခန်းမ","Aung Mingalar Highway","Sule (City Hall)","sule"],
    ["116","","ထောက်ကြန့်","ဆူးလေမြို့တော်ခန်းမ","Htauk Kyant","Sule (City Hall)","sule"],
    ["117","","ဒဂုံတက္ကသိုလ်","သခင်မြပန်းခြံ","Dagon University","Thakhin Mya Park","thakhin"],
    ["118","","သုခဒဂုံအိမ်ယာ","ရန်ကုန်ဘူတာကြီး","Thukha Dagon Housing","Yangon Central Railway Station","railway"],
    ["119","","အောင်မင်္ဂလာအဝေးပြေး","ဒဂုံဧရာအဝေးပြေး","Aung Mingalar Highway","Dagon Ayeyar Highway","other"],
    ["120","","သာကေတ","ပန်းဆိုးတန်း","Thaketa","Pabedan","pabedan"],
    ["123","A Phyauk","အဖျောက်","အင်းစိန်ပန်းခြံ","A Phyauk","Insein Park","insein"],
    ["123","Taikkyi","တိုက်ကြီးစျေး","အင်းစိန်ပန်းခြံ","Taikkyi Market","Insein Park","insein"],
    ["124","","ဆကာကြီး","အင်းစိန်ပန်းခြံ","Hsa Kar Gyi","Insein Park","insein"],
    ["126","","လှိုင်သာယာ","စော်ဘွားကြီးကုန်းလမ်းဆုံ","Hlaing Thar Yar","Saw Bwar Gyi Gone Junction","other"],
    ["128","","ဒဂုံတက္ကသိုလ်","သခင်မြပန်းခြံ","Dagon University","Thakhin Mya Park","thakhin"],
    ["129","","ကျောက်တန်း","အနောက်မြင်းပြိုင်ကွင်းလမ်း","Kyauktan","West Race Course Rd","other"],
    ["130","","အနောက်ပိုင်းနည်းပညာတက္ကသိုလ်","သခင်မြပန်းခြံ","West Technological University","Thakhin Mya Park","thakhin"],
    ["131","","ရန်ကုန်အနောက်ပိုင်းတက္ကသိုလ်","လသာ","West Yangon University","Latha","latha"],
    ["132","","အနောက်ပိုင်းတက္ကသိုလ်","ကမ်းနားလမ်း","West Yangon University","Strand Rd","other"],
    ["133","","ယုဇနဥယျာဉ်မြို့တော်","ဆူးလေ","Yuzana Garden City","Sule","sule"],
    ["134","","၁၆၈ ရပ်ကွက်","လသာ","Ward 168","Latha","latha"],
    ["136","","အောင်မင်္ဂလာအဝေးပြေး","လသာ","Aung Mingalar Highway","Latha","latha"],
    ["137","","ဒဂုံတက္ကသိုလ်","အင်းစိန်ပန်းခြံ","Dagon University","Insein Park","insein"],
    ["138","","ရွှေပေါက်ကံ","ဒဂုံဧရာအဝေးပြေး","Shwe Pauk Kan","Dagon Ayeyar Highway","other"],
    ["139","","ဒဂုံတက္ကသိုလ်","ဆူးလေ","Dagon University","Sule","sule"],
    ["141","","ရွှေပြည်သာ","သခင်မြပန်းခြံ","Shwepyitha","Thakhin Mya Park","thakhin"],
    ["142","","ရွှေပြည်သာ","သခင်မြပန်းခြံ","Shwepyitha","Thakhin Mya Park","thakhin"],
    ["143","","ဝါးတရာ","သခင်မြပန်းခြံ","Wa Tayar","Thakhin Mya Park","thakhin"],
    ["144","","ယုဇနဥယျာဉ်မြို့တော်","သခင်မြပန်းခြံ","Yuzana Garden City","Thakhin Mya Park","thakhin"],
    ["145","","ရွှေပြည်သာ","ဗိုလ်တထောင်ဘုရားလမ်း","Shwepyitha","Botahtaung Pagoda Rd","botahtaung"],
    ["APS","Airport Shuttle","","","Yangon Airport","Downtown (Airport Shuttle)","air",true],
    ["Sule–Dala","Trial","ဆူးလေ","ဒလ","Sule","Dala","sule"],
    ["Sule–Dala","Trial (welcome)","ဆူးလေ","ဒလ","Sule","Dala","sule"],
    ["Botahtaung–Dala","Trial","ဗိုလ်တထောင်ဘုရား","ဒလ","Botahtaung Pagoda","Dala","botahtaung"],
    ["Dala–Twante","Trial","ဒလ","တွံတေး","Dala","Twante","other"],
    ["Dala Ferry–Sule","Trial","ဒလ (သင်္ဘောဆိပ်)","ဆူးလေ","Dala Ferry Terminal","Sule","sule"]
  ];

  var routes = R.map(function (r) {
    return { num: r[0], variant: r[1], mmA: r[2], mmB: r[3], enA: r[4], enB: r[5], group: r[6], h24: !!r[7],
             open: r[7] ? "00:00" : DEFAULT_OPEN, close: r[7] ? "24:00" : DEFAULT_CLOSE };
  });

  /* ---------- Helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function yangonNow() {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Yangon", hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    return { h: parseInt(o.hour, 10) % 24, m: parseInt(o.minute, 10), wd: o.weekday };
  }
  function toMin(t) { var a = t.split(":"); return parseInt(a[0], 10) * 60 + parseInt(a[1], 10); }
  function isRunning(r) {
    if (r.h24) return true;
    var n = yangonNow(), cur = n.h * 60 + n.m;
    return cur >= toMin(r.open) && cur < toMin(r.close);
  }

  /* ---------- Language (shares the "lang" setting with index.html) ---------- */
  function t(en, my) { return '<span class="en">' + en + '</span><span class="my">' + my + '</span>'; }
  function initLang() {
    var b = document.body, l;
    try { l = localStorage.getItem("lang"); } catch (e) {}
    function set(x) {
      b.dataset.lang = x;
      document.documentElement.lang = x === "my" ? "my" : "en";
      try { localStorage.setItem("lang", x); } catch (e) {}
    }
    set(l || ((navigator.language || "").slice(0, 2) === "my" ? "my" : "en"));
    $("lang").onclick = function () { set(b.dataset.lang === "en" ? "my" : "en"); };
  }

  /* ---------- Render ---------- */
  var activeGroup = null;

  function buildLegend() {
    var el = $("legend");
    el.innerHTML = "";
    Object.keys(GROUPS).forEach(function (k) {
      var g = GROUPS[k];
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.style.setProperty("--c", g.color);
      b.setAttribute("aria-pressed", "false");
      b.dataset.group = k;
      b.innerHTML = '<span class="dot"></span>' + t(esc(g.name), esc(g.my));
      b.addEventListener("click", function () {
        activeGroup = (activeGroup === k) ? null : k;
        Array.prototype.forEach.call(el.children, function (c) { c.setAttribute("aria-pressed", c.dataset.group === activeGroup ? "true" : "false"); });
        render();
      });
      el.appendChild(b);
    });
  }

  function render() {
    var q = $("q").value.trim().toLowerCase();
    var only24 = $("only24").checked, onlyNow = $("onlyNow").checked;
    var list = routes.filter(function (r) {
      if (activeGroup && r.group !== activeGroup) return false;
      if (only24 && !r.h24) return false;
      if (onlyNow && !isRunning(r)) return false;
      if (!q) return true;
      var hay = (r.num + " " + r.variant + " " + r.enA + " " + r.enB + " " + r.mmA + " " + r.mmB + " ybs " + GROUPS[r.group].name + " " + GROUPS[r.group].my).toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    $("count").innerHTML = t(list.length + " of " + routes.length + " lines shown", "လိုင်း " + routes.length + " ခုအနက် " + list.length + " ခု ပြထားသည်");
    var grid = $("grid");
    if (!list.length) { grid.innerHTML = '<div class="empty">' + t("No bus line matches your search.", "ရှာဖွေမှုနှင့် ကိုက်ညီသော ဘတ်စ်ကားလိုင်း မတွေ့ပါ။") + '</div>'; return; }

    grid.innerHTML = list.map(function (r) {
      var g = GROUPS[r.group], running = isRunning(r);
      var hours = r.h24 ? t("24 hours", "၂၄ နာရီ") : r.open + " – " + r.close;
      var mm = (r.mmA || r.mmB) ? '<span class="mm">' + esc(r.mmA) + " – " + esc(r.mmB) + "</span>" : "";
      return '<article class="card" style="--c:' + g.color + '">' +
        '<header><div class="num"><small>YBS</small>' + esc(r.num) + '</div>' +
        '<div class="variant">' + (r.variant ? esc(r.variant) : t(esc(g.name), esc(g.my))) + '</div></header>' +
        '<div class="gates"><span class="gate"><b>' + t("From:", "မှ:") + '</b> ' + esc(r.enA) + '</span>' +
        '<span class="gate"><b>' + t("To:", "သို့:") + '</b> ' + esc(r.enB) + '</span>' + mm + '</div>' +
        '<div class="meta"><span class="hours">🕔 ' + hours + '</span>' +
        (r.h24 ? '<span class="tg h24">24H</span>' : '') +
        '<span class="tg ' + (running ? 'live">' + t("Running now", "ယခုပြေးနေသည်") : 'off">' + t("Not running", "မပြေးတော့ပါ")) + '</span></div>' +
        '</article>';
    }).join("");
  }

  /* ---------- Weather (Open-Meteo, no key needed) ---------- */
  var RAIN_CODES = [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99];
  function setPill(id, cls, html) { var p = $(id); p.className = "pill " + cls; p.innerHTML = html; }

  function loadWeather() {
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + LAT + "&longitude=" + LON +
      "&current=temperature_2m,precipitation,rain,weather_code&timezone=Asia%2FYangon";
    fetch(url).then(function (r) { return r.json(); }).then(function (d) {
      var c = d.current, raining = (c.precipitation > 0) || (c.rain > 0) || RAIN_CODES.indexOf(c.weather_code) !== -1;
      var storm = [95,96,99].indexOf(c.weather_code) !== -1;
      $("wIcon").textContent = storm ? "⛈️" : raining ? "🌧️" : (c.weather_code <= 1 ? "☀️" : "⛅");
      $("wText").innerHTML = raining ? t("Yes, it is raining now", "ဟုတ်ကဲ့၊ ယခု မိုးရွာနေသည်") : t("No rain right now", "ယခု မိုးမရွာပါ");
      $("wSub").innerHTML = Math.round(c.temperature_2m) + "°C · " + t("rain", "မိုး") + " " + (c.precipitation || 0) + " mm";
      setPill("wPill", raining ? "bad" : "ok", raining ? t("Take an umbrella", "ထီးယူသွားပါ") : t("Dry", "ခြောက်သွေ့"));
    }).catch(function () {
      $("wIcon").textContent = "❔";
      $("wText").innerHTML = t("Weather unavailable", "ရာသီဥတု မရနိုင်ပါ");
      $("wSub").innerHTML = t("Use the Google Weather button.", "Google ရာသီဥတု ခလုတ်ကို သုံးပါ။");
      setPill("wPill", "na", t("Offline", "အော့ဖ်လိုင်း"));
    });
  }

  /* ---------- Traffic (rush-hour estimate + link to Google Maps live traffic) ---------- */
  function loadTraffic() {
    var n = yangonNow(), tm = n.h * 60 + n.m, sunday = n.wd === "Sun";
    var morning = tm >= 420 && tm < 600, evening = tm >= 960 && tm < 1140;
    var level, text, sub, icon;
    if (!sunday && (morning || evening)) {
      level = "bad"; icon = "🚗🚗🚗";
      text = t("Traffic is probably heavy", "ယာဉ်ကြောပိတ်ဆို့နိုင်ချေများသည်");
      sub = t("Rush hour – allow extra time for buses.", "ကားပိတ်ချိန် – ဘတ်စ်ကားအတွက် အချိန်ပိုချန်ပါ။");
    } else if (!sunday && ((tm >= 600 && tm < 720) || (tm >= 900 && tm < 960) || (tm >= 1140 && tm < 1230))) {
      level = "warn"; icon = "🚗🚗";
      text = t("Traffic may be moderate", "ယာဉ်ကြော အလယ်အလတ်ဖြစ်နိုင်သည်");
      sub = t("Roads are busy in places.", "လမ်းအချို့တွင် ကားများသည်။");
    } else {
      level = "ok"; icon = "🚗";
      text = t("Traffic is probably light", "ယာဉ်ကြောပေါ့ပါးနိုင်ချေများသည်");
      sub = sunday ? t("Sunday – usually lighter.", "တနင်္ဂနွေ – များသောအားဖြင့် ပေါ့ပါးသည်။") : t("Off-peak hours.", "ကားမများသောအချိန်။");
    }
    $("tIcon").textContent = icon;
    $("tText").innerHTML = text;
    $("tSub").innerHTML = sub;
    setPill("tPill", level,
      level === "bad" ? t("Bad (estimate)", "ဆိုး (ခန့်မှန်း)") :
      level === "warn" ? t("Moderate (estimate)", "အလယ်အလတ် (ခန့်မှန်း)") :
      t("Good (estimate)", "ကောင်း (ခန့်မှန်း)"));
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initLang();
    buildLegend();
    render();
    loadWeather();
    loadTraffic();
    $("q").addEventListener("input", render);
    $("only24").addEventListener("change", render);
    $("onlyNow").addEventListener("change", render);
    setInterval(loadWeather, 10 * 60 * 1000);
    setInterval(function () { loadTraffic(); render(); }, 5 * 60 * 1000);
  });
})();
