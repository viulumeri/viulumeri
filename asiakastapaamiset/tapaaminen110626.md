# Pöytäkirja 11.06.2026 / Sprintti 4


## Admin-tilan kehittäminen:

* Adminin ei tule voida poistaa itse itseään.
* Superadminneille korkeammat oikeudet?
  - Voisi olla asiakkaan mielestä hyvä.

* Riittäkö pelkkä teksti osoittamaa, että on admin vai korostetaanko jollakin värillä.
  - Joku sopiva.

* Pitäisikö näkyä, että oppillaalle tulee uusi läksy.
  - Ei tarvitse olla indikaatiota.
  - Läksyissä voi ottaa pois tehtäväsanan ja jäisi vain päivämäärä.


## Käyttöä tukevat palvelut:

* Asiakas kokee nykysen PWA-ominaisuuden hyvänä. Estää mm. häiriökäytöksiä.
* Onko ongelma jos refreshaus kirjaa ulos offline-tilassa?
* Service Workkeria ei välttämättä kannatta jatkaa - kaikki on melko kevyttä.

* Pitäisikö kaikkien pop-uppien olla luonnoksia paitsi jos pop-up on julkaistu? 
* Tekstieditorin tilanne.
  - Asiakas pitää nykyistä ratkaisua omanlaisena.

* Saako asennusohjeet auki jostain? Voivatko olla FAQ:ssa?
* Jos FAQ:ssa olisi vain yksi oma nappi ohjeille.
* Asennusohjeet ovat oma osionsa. 
  - FAQ:han ja popuppeihin tulisi saada useampi kuva lisättyä. Asiakkaan tulee voida valita
  elementit.

* Ovatko logi ja käyttäjän poisto liian lähellä toisiaan?


## UI:n kehittäminen:

* Pitäisikö kotitehtävien pallojen olla ylempänä? Voivatko pallot olla kortin yläpuolella? 
  - Asiakas on kuitenkin tyytyväinen tähän ratkaisuun.

* Jos menee oppilas tai opetttaja -näkymään niin tulisiko navbarissa näkyä kotisivu.
  - Näkymä on kuitenkin asiakkaan mielestä hyviä.

* Palautteita ei saa vielä poistettua.
  - Asiakkaan mielestä UL-sliikkaus on hyvä asia.
  - Pitääkö olla tummempi tausta joillain sivuilla yms. ?

* UI:ssa pitäisi huomioda teksti ja opettajan uusien tehtävien lisäys.

* 'Piilota'- ja 'Näytä kuva' -näppäimet ovat turhia.

* Kuvan latauksessa ohjelman pitäisi tehdä automaattisesti kuva, joka näyttää koon puolelta hyvältä.

* Nimen häviämis -bugi on korjattu.


## Infrastruktuuri:

* Ei tunkata infraa enempää.

* Docker Compose -käyttö. Edwin käyttää npm -käynnistystä. Kaiken tulisi olla Docker containerissa.
  - Ajatuksena on, että olisi skripti, joka ottaisi ssh-yhteyden tuotantoserveriin. Tämä menee myös tietokannan kansioon.
  pitäisikö tietokannasta ottaa dumppi vai voidaanko tietokanta kopioda lokaalisti.
  - Asiakkaan mielestä kaikille tulee olla sama Dev-ympäristö.

* Kuvien hostauksen tarjoaminen omalta palvelimelta. Tällä hetkellä kuvat tulevat kolmannen osapuolen kautta.
  - Asiakas toivoo tätä. 
  - Asiakas järjestää pääsy kansioon kuvia varten.

* Onko mahdollista, että sen sijaan että klusterilla on kansio, jossa on biisit niin admin näkymässä olisi
toiminto kuvien ja biisien hallintaan.
  - Asiakas toivoo tätä.

## Tekninen velka:

* Teknisen velan osalta e2e-testejä voidaan vähentää. 3 minuuttia ei ole vielä paha.
* Lähtökohta on ollut hyvä.
* Parempi dokumentointi.
* Vielä parannuksia inpersonete-näkymään.
  - Teknisen velan määrä kiinnostaa asiakasta.
  - Decision-dokumentti on asiakkaan mielestä hyvä käytäntö. Merkitään ainakin admin-toimintoja koskevat päätökset.


## Tulevat tapahtumat:

* Seuraava asiakastapaaaminen ensi viikolla 22.6. klo 15:00.

* Mikä on burgerien tilanne?
  - Mennään oljenkorteen. Asiakas tarjoaa yhden tacon ja juoman tai sitten mietitään joku Burger-paikka.
  - Sovitaan ajankohdaksi 22.6. klo. 16:00 Oljenkorressa.

