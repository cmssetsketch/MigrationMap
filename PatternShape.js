let shapeSVGs = {};


const shapeNames = [
  "01","02","03","04","05","06","07","08","09","10",
  "11","12","13","14","15","16","17","18","19","20",
  "21","22","23","24","25"
];


const shapeGroups = {
  "01": ["American Samoa" , "United States of America", "Botswana", "Guam" ,"New Zealand", "Laos","Hong Kong", "Nepal", "Tadjikistan","Yemen", "Peru", "Puerto Rico", "Mexico", "Guinea", "Democratic Republic of the Congo", "South Sudan", "Italy", "Czechia", "Netherlands" , "Denmark","Polynesia"],
  "02": ["Wallis and Futuna Islands" , "Kiribati", "New Caledonia" ,"Myanmar", "Japan" , "India" ,"Iraq" ,"Ecuador" , "Dominica" , "Canada" , "Niger"  , "Chad"  , "South Africa", "Libya" ,"Croatia" ,  "Belgium",  "Ukraine"],
 "03": [ "Bahrain"  ,"United States Virgin Islands", "Mayotte" ,"Montenegro"],
   "04": ["Spain"  , "Cook Islands" ,  "Samoa" ,"Bangladesh" ,"Saudi Arabia" ,"Brazil" ,"Martinique" ,"Honduras" , "Nigeria" ,"Cameroon", "Djibouti" ,"Morocco" , "Slovakia" ,  "Ireland"],
 "05": ["Georgia" , "Réunion" , "Saint Kitts and Nevis"],
  "06": ["Argentina"  ,"Saint Lucia", "Togo" ,"Eswatini" ,"Malawi"],
  "07": ["Algeria", "Montserrat","Sao Tome and Principe"  , "Mali"  , "Faroe Islands" ,"Gibraltar"] ,
 "08": ["Niue" ,  "Timor-Leste" ,"Mongolia"  , "Kazakhstan" ,"United Arab Emirates" , "Jamaica" , "Liberia" ,"Lesotho","Tanzania" ,  "Andorra"  ,"Russia" , "Norway" ],
  "09": [ "Melanesia" , "Marshall Islands",  "Singapore" , "Lebanon" ,"Guyana" , "Dominican Republic" , "El Salvador" ,"Mauritania"  , "Gabon" , "Kenya" , "Western Sahara"  , "Albania"  , "Germany", "Finland" ,"Greenland" ],
 "10": ["Qatar" ,"Mauritius" ,"Antigua and Barbuda","Channel Islands" ,"Isle of Man" ],  
  "11": ["Pakistan" ,"Armenia" ,  "Uruguay"  , "Trinidad and Tobago", "Saint Helena", "Zimbabwe"  ,"Romania", "Serbia"],
  "12": ["Northern Mariana Islands" , "Fiji" ,"Viet Nam" ,"Sri Lanka" ,  "Kyrgyzstan" , "China"  , "Türkiye" ,"Bolivia" , "Cuba" ,  "Guatemala" ,"Saint Pierre and Miquelon" , "Côte d'Ivoire" , "Central African Republic"  , "Namibia" , "Eritrea" , "Sudan" ,  "Greece" ,  "Poland" ,"Switzerland","Sweden"],
 "13": [ "French Polynesia" , "Australia" ,"Cambodia" , "Macao" , "Bhutan" ,"Syria" ,"French Guiana" ,   "Guadeloupe", "Belize", "Bermuda" , "Madagascar" ,  "Burkina Faso" , "Angola", "Ethiopia" ,"Tunisia"  , "Hungary" ,"France", "United Kingdom"], 
  "14": ["Palau" ,  "Tonga" ,"Philippines" ,"Taiwan", "Uzbekistan"  , "Oman" ,"Cayman Islands", "Sierra Leone" , "Burundi", "Kosovo"],
     "15": ["Kuwait"  , "Paraguay" ,"Barbados" , "Ghana" ,"Mozambique","Iran"],
  "16": ["Anguilla",  "Luxembourg"  ],
  "17": ["Tokelau" , "Micronesia States" ,  "Solomon Islands" ,"Malaysia" ,"North Korea" ,  "Israel"  ,"Colombia" , "Bahamas" , "Panama","Senegal" , "Equatorial Guinea"   ,"Rwanda","Egypt",  "Bosnia and Herzegovina" ,  "Moldova" , "Monaco" ,"Estonia" ,"Portugal" ],
  "18": ["Afghanistan" ,"Turkmenistan"  ,"Chile" ,"Saint Vincent and the Grenadines", "Benin", "Zambia" , "Bulgaria" ],
  "19": ["Sint Maarten"], 
 "20": ["Cyprus" ,"Malvinas" ,"Grenada","Seychelles"  ,"Cabo Verde" ,"San Marino" ,"Holy See","Iceland"],
  "21": ["Nauru"   ,"Papua New Guinea" ,"Indonesia" ,"Jordan" , "Suriname" ,"Haiti" ,  "Nicaragua","Guinea-Bissau" ,"Somalia","Slovenia" ,"Belarus" , "Latvia", "Maldives"],
  "22": ["Brunei Darussalam" ,"Azerbaijan" ,"British Virgin Islands","Comoros" ,"Liechtenstein","Malta" ],  
  "23": ["Tuvalu" ,  "Micronesia" , "Vanuatu" , "Thailand" , "South Korea", "Venezuela" ,"Palestine" , "Turks and Caicos Islands","Costa Rica","Gambia" , "Congo"  , "Uganda" , "North Macedonia" , "Austria","Lithuania"],
  "24": ["Aruba","Bonaire, Sint Eustatius and Saba"],
  "25": ["Curaçao"] 
};

// 2. AUTO-BUILD reverse mapping: country → shapeId
const countryToShape = {};
for (let shapeId in shapeGroups) {
  shapeGroups[shapeId].forEach(country => {
    countryToShape[country] = shapeId;

  });
}
