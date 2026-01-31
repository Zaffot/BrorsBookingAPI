1. Mitä tekoäly teki hyvin?

Tekoäly toimi hyvänä sparrausparina API:n suunnitteluvaiheessa. Se auttoi nopeasti hahmottamaan toimivan perusratkaisun ja tarjosi useita vaihtoehtoja kehitys vaiheessa, joiden pohjalta pystyin itse arvioimaan, kyseenalaistamaan ja kehittämään ratkaisua eteenpäin.

Tekoäly tuotti nopeasti toimivan ensimmäisen version rajapinnasta, joka täytti tehtävänannon keskeiset vaatimukset:

- tarvittavat endpointit
- in-memory-tallennus
- selkeä varausdatan rakenne
- keskeisten business rulejen tunnistaminen

Erityisesti tekoälyn vahvuus oli siinä, että se auttoi viemään ajatukset nopeasti konkreettiseen muotoon. Keskustelun aikana syntyi uusia näkökulmia, joita en olisi välttämättä huomannut yhtä nopeasti ilman sparraavaa keskustelua.

Tekoäly toimi tehokkaana ideointikumppanina ja lähtökohtana jatkokehitykselle, mutta ei korvannut omaa harkintaa tai päätöksentekoa.

2. Mitä tekoäly teki huonosti?

Vaikka tekoäly tuotti nopeasti toimivan perusratkaisun, sen tuottamassa koodissa ilmeni useita puutteita, jotka vaativat ihmisen tekemää kriittistä tarkastelua ja korjaamista.

Merkittävin heikkous liittyi aikakäsittelyyn ja syötteiden validointiin. Tekoäly luotti liikaa JavaScriptin Date-olion automaattiseen parsintaan ilman riittävää kontrollia siitä, mitä aikamuotoja hyväksytään. Tämä johti tilanteeseen, jossa osa virheellisistä tai epäselvistä aikamuodoista olisi voinut mennä läpi validoinnista, vaikka tehtävänannossa vaadittiin selkeästi ISO 8601 -muotoa.

Rakenteellisesti tekoälyn tuottama ratkaisu oli liian tiivis. Reitit, validointi ja liiketoimintalogiikka sijaitsivat  samassa tiedostossa, mikä on ymmärrettävää yksinkertaisessa esimerkissä, mutta ei vastaa hyvää käytäntöä, jos sovellusta halutaan kehittää tai ylläpitää pidemmällä aikavälillä.

Lisäksi testaus jäi tekoälyn tuottamassa ratkaisussa kokonaan huomioimatta. Ratkaisu keskittyi toiminnalliseen toteutukseen, mutta ei ottanut kantaa siihen, miten koodin toimivuutta tai muutosten vaikutuksia voisi arvioida myöhemmin. Tämä korostaa ihmisen roolia kokonaisuuden katselmoinnissa ja ratkaisun laadun varmistamisessa. Tätä tietysti olisin voinut huomioida jo promptissa.


3. Mitkä olivat tärkeimmät parannukset, jotka teit tekoälyn tuottamaan koodiin ja miksi?

Tärkeimmät tekemäni parannukset liittyivät koodin rakenteen selkeyttämiseen sekä aikakäsittelyn ja validoinnin tarkentamiseen. Tavoitteena oli tehdä ratkaisusta helpommin ymmärrettävä ja ennakoitavampi, ei lisätä siihen uusia ominaisuuksia.

Yksi keskeisimmistä muutoksista oli koodin rakenteen tarkastelu ja siistiminen. Tekoälyn tuottamassa ratkaisussa useat vastuut olivat samassa kokonaisuudessa, mikä teki koodin lukemisesta ja hahmottamisesta vaikeampaa. Selkeyttämällä rakennetta pyrin siihen, että eri osat on helpompi ymmärtää ja että koodi tukee paremmin jatkokehitystä.

Toinen merkittävä parannus koski aikojen käsittelyä. Täsmensin aikamuodon validointia, jotta rajapinta hyväksyy vain selkeästi määritellyt ISO 8601 -muodot. Tämä vähensi epäselviä tulkintoja ja teki aikojen käsittelystä johdonmukaisempaa. Aikakäsittely osoittautui erityisen herkäksi osa-alueeksi, jossa tekoälyn tuottama ratkaisu vaati eniten ihmisen tekemää harkintaa. Tätä olisi tullut vielä hioda lisääkin. 

Lisäksi tein pieniä mutta tarkoituksellisia tarkennuksia liiketoimintalogiikkaan ja virhetilanteiden käsittelyyn, jotta rajapinnan toiminta vastaisi paremmin tehtävänannon reunaehtoja. Näiden muutosten tarkoituksena ei ollut muuttaa kokonaisuutta merkittävästi, vaan parantaa olemassa olevan ratkaisun luotettavuutta ja selkeyttä.

