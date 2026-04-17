// Static dataset of US State Parks, State Forests, and State Recreation Areas
// This provides reliable offline data without API dependencies

import { Park } from '../types';

interface StateParkData {
  name: string;
  state: string;
  lat: number;
  lng: number;
  designation: 'State Park' | 'State Forest' | 'State Beach' | 'State Recreation Area' | 'State Natural Area' | 'State Reserve';
}

// Comprehensive list of US State Parks by state
const STATE_PARKS_DATA: StateParkData[] = [
  // Alabama
  { name: "Gulf State Park", state: "AL", lat: 30.2627, lng: -87.6418, designation: "State Park" },
  { name: "Oak Mountain State Park", state: "AL", lat: 33.3312, lng: -86.7589, designation: "State Park" },
  { name: "Lake Guntersville State Park", state: "AL", lat: 34.4034, lng: -86.2269, designation: "State Park" },
  { name: "Monte Sano State Park", state: "AL", lat: 34.7431, lng: -86.5125, designation: "State Park" },
  { name: "Cheaha State Park", state: "AL", lat: 33.4858, lng: -85.8094, designation: "State Park" },
  { name: "DeSoto State Park", state: "AL", lat: 34.5003, lng: -85.6194, designation: "State Park" },
  { name: "Joe Wheeler State Park", state: "AL", lat: 34.7606, lng: -87.3200, designation: "State Park" },
  { name: "Wind Creek State Park", state: "AL", lat: 32.8051, lng: -85.9522, designation: "State Park" },

  // Alaska
  { name: "Chugach State Park", state: "AK", lat: 61.1508, lng: -149.6517, designation: "State Park" },
  { name: "Denali State Park", state: "AK", lat: 62.8500, lng: -150.4000, designation: "State Park" },
  { name: "Kachemak Bay State Park", state: "AK", lat: 59.5500, lng: -151.2000, designation: "State Park" },
  { name: "Wood-Tikchik State Park", state: "AK", lat: 59.8333, lng: -159.1667, designation: "State Park" },

  // Arizona
  { name: "Kartchner Caverns State Park", state: "AZ", lat: 31.8372, lng: -110.3472, designation: "State Park" },
  { name: "Dead Horse Ranch State Park", state: "AZ", lat: 34.7642, lng: -111.9961, designation: "State Park" },
  { name: "Slide Rock State Park", state: "AZ", lat: 34.9428, lng: -111.7517, designation: "State Park" },
  { name: "Lost Dutchman State Park", state: "AZ", lat: 33.4575, lng: -111.4794, designation: "State Park" },
  { name: "Catalina State Park", state: "AZ", lat: 32.4264, lng: -110.9167, designation: "State Park" },
  { name: "Patagonia Lake State Park", state: "AZ", lat: 31.4917, lng: -110.8500, designation: "State Park" },
  { name: "Lake Havasu State Park", state: "AZ", lat: 34.4731, lng: -114.3478, designation: "State Park" },
  { name: "Picacho Peak State Park", state: "AZ", lat: 32.6433, lng: -111.4050, designation: "State Park" },

  // Arkansas
  { name: "Devil's Den State Park", state: "AR", lat: 35.7789, lng: -94.2428, designation: "State Park" },
  { name: "Petit Jean State Park", state: "AR", lat: 35.1136, lng: -92.9364, designation: "State Park" },
  { name: "Mount Magazine State Park", state: "AR", lat: 35.1672, lng: -93.6447, designation: "State Park" },
  { name: "Crater of Diamonds State Park", state: "AR", lat: 34.0317, lng: -93.6692, designation: "State Park" },
  { name: "Buffalo National River State Park", state: "AR", lat: 35.9856, lng: -92.7578, designation: "State Park" },
  { name: "Lake Catherine State Park", state: "AR", lat: 34.4356, lng: -92.8878, designation: "State Park" },

  // California
  { name: "Anza-Borrego Desert State Park", state: "CA", lat: 33.1284, lng: -116.3031, designation: "State Park" },
  { name: "Big Basin Redwoods State Park", state: "CA", lat: 37.1717, lng: -122.2228, designation: "State Park" },
  { name: "Humboldt Redwoods State Park", state: "CA", lat: 40.2961, lng: -123.9722, designation: "State Park" },
  { name: "Point Lobos State Natural Reserve", state: "CA", lat: 36.5156, lng: -121.9408, designation: "State Reserve" },
  { name: "Julia Pfeiffer Burns State Park", state: "CA", lat: 36.1581, lng: -121.6719, designation: "State Park" },
  { name: "Pfeiffer Big Sur State Park", state: "CA", lat: 36.2469, lng: -121.7831, designation: "State Park" },
  { name: "Mount Tamalpais State Park", state: "CA", lat: 37.9236, lng: -122.5964, designation: "State Park" },
  { name: "Crystal Cove State Park", state: "CA", lat: 33.5731, lng: -117.8353, designation: "State Park" },
  { name: "Torrey Pines State Natural Reserve", state: "CA", lat: 32.9203, lng: -117.2514, designation: "State Reserve" },
  { name: "Point Reyes State Park", state: "CA", lat: 38.0694, lng: -122.8808, designation: "State Park" },
  { name: "El Capitan State Beach", state: "CA", lat: 34.4581, lng: -120.0256, designation: "State Beach" },
  { name: "Leo Carrillo State Park", state: "CA", lat: 34.0444, lng: -118.9331, designation: "State Park" },
  { name: "Malibu Creek State Park", state: "CA", lat: 34.1000, lng: -118.7311, designation: "State Park" },
  { name: "Henry Cowell Redwoods State Park", state: "CA", lat: 37.0461, lng: -122.0594, designation: "State Park" },
  { name: "Prairie Creek Redwoods State Park", state: "CA", lat: 41.3703, lng: -124.0178, designation: "State Park" },
  { name: "Jedediah Smith Redwoods State Park", state: "CA", lat: 41.7975, lng: -124.1000, designation: "State Park" },
  { name: "Calaveras Big Trees State Park", state: "CA", lat: 38.2833, lng: -120.3000, designation: "State Park" },
  { name: "Auburn State Recreation Area", state: "CA", lat: 38.9117, lng: -121.0458, designation: "State Recreation Area" },
  { name: "San Onofre State Beach", state: "CA", lat: 33.3781, lng: -117.5669, designation: "State Beach" },
  { name: "Huntington State Beach", state: "CA", lat: 33.6428, lng: -117.9783, designation: "State Beach" },

  // Colorado
  { name: "Cherry Creek State Park", state: "CO", lat: 39.6397, lng: -104.8386, designation: "State Park" },
  { name: "Chatfield State Park", state: "CO", lat: 39.5347, lng: -105.0708, designation: "State Park" },
  { name: "Eldorado Canyon State Park", state: "CO", lat: 39.9308, lng: -105.2836, designation: "State Park" },
  { name: "Roxborough State Park", state: "CO", lat: 39.4317, lng: -105.0689, designation: "State Park" },
  { name: "Golden Gate Canyon State Park", state: "CO", lat: 39.8317, lng: -105.4297, designation: "State Park" },
  { name: "State Forest State Park", state: "CO", lat: 40.6000, lng: -106.0000, designation: "State Park" },
  { name: "Mueller State Park", state: "CO", lat: 38.8833, lng: -105.1833, designation: "State Park" },
  { name: "Staunton State Park", state: "CO", lat: 39.5092, lng: -105.3747, designation: "State Park" },
  { name: "Rifle Falls State Park", state: "CO", lat: 39.6778, lng: -107.6983, designation: "State Park" },
  { name: "Steamboat Lake State Park", state: "CO", lat: 40.7833, lng: -106.9667, designation: "State Park" },

  // Connecticut
  { name: "Sleeping Giant State Park", state: "CT", lat: 41.4264, lng: -72.8978, designation: "State Park" },
  { name: "Hammonasset Beach State Park", state: "CT", lat: 41.2639, lng: -72.5556, designation: "State Park" },
  { name: "Devil's Hopyard State Park", state: "CT", lat: 41.4817, lng: -72.3417, designation: "State Park" },
  { name: "Kent Falls State Park", state: "CT", lat: 41.7767, lng: -73.4239, designation: "State Park" },
  { name: "Talcott Mountain State Park", state: "CT", lat: 41.8347, lng: -72.7939, designation: "State Park" },

  // Delaware
  { name: "Cape Henlopen State Park", state: "DE", lat: 38.8003, lng: -75.0919, designation: "State Park" },
  { name: "Delaware Seashore State Park", state: "DE", lat: 38.6392, lng: -75.0658, designation: "State Park" },
  { name: "Trap Pond State Park", state: "DE", lat: 38.5256, lng: -75.4747, designation: "State Park" },
  { name: "Killens Pond State Park", state: "DE", lat: 38.9817, lng: -75.5417, designation: "State Park" },
  { name: "Brandywine Creek State Park", state: "DE", lat: 39.8172, lng: -75.5686, designation: "State Park" },

  // Florida
  { name: "Bahia Honda State Park", state: "FL", lat: 24.6556, lng: -81.2803, designation: "State Park" },
  { name: "John Pennekamp Coral Reef State Park", state: "FL", lat: 25.1225, lng: -80.4083, designation: "State Park" },
  { name: "Myakka River State Park", state: "FL", lat: 27.2342, lng: -82.3114, designation: "State Park" },
  { name: "Ichetucknee Springs State Park", state: "FL", lat: 29.9833, lng: -82.7667, designation: "State Park" },
  { name: "Wakulla Springs State Park", state: "FL", lat: 30.2350, lng: -84.3017, designation: "State Park" },
  { name: "Grayton Beach State Park", state: "FL", lat: 30.3228, lng: -86.1617, designation: "State Park" },
  { name: "St. Andrews State Park", state: "FL", lat: 30.1275, lng: -85.7375, designation: "State Park" },
  { name: "Blue Spring State Park", state: "FL", lat: 28.9450, lng: -81.3392, designation: "State Park" },
  { name: "Anastasia State Park", state: "FL", lat: 29.8569, lng: -81.2678, designation: "State Park" },
  { name: "Wekiwa Springs State Park", state: "FL", lat: 28.7125, lng: -81.4608, designation: "State Park" },
  { name: "Paynes Prairie Preserve State Park", state: "FL", lat: 29.5386, lng: -82.3028, designation: "State Park" },
  { name: "Hillsborough River State Park", state: "FL", lat: 28.1475, lng: -82.2358, designation: "State Park" },
  { name: "Rainbow Springs State Park", state: "FL", lat: 29.1017, lng: -82.4361, designation: "State Park" },
  { name: "Sebastian Inlet State Park", state: "FL", lat: 27.8544, lng: -80.4531, designation: "State Park" },
  { name: "Big Talbot Island State Park", state: "FL", lat: 30.4572, lng: -81.4297, designation: "State Park" },

  // Georgia
  { name: "Cloudland Canyon State Park", state: "GA", lat: 34.8367, lng: -85.4817, designation: "State Park" },
  { name: "Amicalola Falls State Park", state: "GA", lat: 34.5692, lng: -84.2461, designation: "State Park" },
  { name: "Tallulah Gorge State Park", state: "GA", lat: 34.7392, lng: -83.3919, designation: "State Park" },
  { name: "Providence Canyon State Park", state: "GA", lat: 32.0675, lng: -84.9094, designation: "State Park" },
  { name: "Vogel State Park", state: "GA", lat: 34.7658, lng: -83.9261, designation: "State Park" },
  { name: "Jekyll Island State Park", state: "GA", lat: 31.0611, lng: -81.4197, designation: "State Park" },
  { name: "Fort Mountain State Park", state: "GA", lat: 34.7617, lng: -84.6989, designation: "State Park" },
  { name: "Sweetwater Creek State Park", state: "GA", lat: 33.7539, lng: -84.6267, designation: "State Park" },
  { name: "Red Top Mountain State Park", state: "GA", lat: 34.1494, lng: -84.7089, designation: "State Park" },
  { name: "Unicoi State Park", state: "GA", lat: 34.7267, lng: -83.7267, designation: "State Park" },

  // Hawaii
  { name: "Na Pali Coast State Wilderness Park", state: "HI", lat: 22.1833, lng: -159.6500, designation: "State Park" },
  { name: "Waimea Canyon State Park", state: "HI", lat: 22.0667, lng: -159.6667, designation: "State Park" },
  { name: "Kokee State Park", state: "HI", lat: 22.1333, lng: -159.6500, designation: "State Park" },
  { name: "Pololu Valley State Park", state: "HI", lat: 20.2000, lng: -155.7333, designation: "State Park" },
  { name: "Iao Valley State Park", state: "HI", lat: 20.8833, lng: -156.5500, designation: "State Park" },
  { name: "Akaka Falls State Park", state: "HI", lat: 19.8542, lng: -155.1528, designation: "State Park" },
  { name: "Hapuna Beach State Recreation Area", state: "HI", lat: 19.9897, lng: -155.8261, designation: "State Recreation Area" },
  { name: "Makena State Park", state: "HI", lat: 20.6317, lng: -156.4417, designation: "State Park" },

  // Idaho
  { name: "Bruneau Dunes State Park", state: "ID", lat: 42.8903, lng: -115.6950, designation: "State Park" },
  { name: "Harriman State Park", state: "ID", lat: 44.3500, lng: -111.4000, designation: "State Park" },
  { name: "Farragut State Park", state: "ID", lat: 47.9500, lng: -116.6167, designation: "State Park" },
  { name: "Ponderosa State Park", state: "ID", lat: 44.9667, lng: -116.1333, designation: "State Park" },
  { name: "Hells Gate State Park", state: "ID", lat: 46.3833, lng: -117.0000, designation: "State Park" },
  { name: "City of Rocks State Park", state: "ID", lat: 42.0833, lng: -113.7167, designation: "State Park" },

  // Illinois
  { name: "Starved Rock State Park", state: "IL", lat: 41.3197, lng: -88.9928, designation: "State Park" },
  { name: "Matthiessen State Park", state: "IL", lat: 41.2833, lng: -89.0167, designation: "State Park" },
  { name: "Giant City State Park", state: "IL", lat: 37.6000, lng: -89.1833, designation: "State Park" },
  { name: "Garden of the Gods Recreation Area", state: "IL", lat: 37.6000, lng: -88.3833, designation: "State Recreation Area" },
  { name: "Pere Marquette State Park", state: "IL", lat: 38.9667, lng: -90.5167, designation: "State Park" },
  { name: "Shawnee National Forest State Park", state: "IL", lat: 37.5000, lng: -88.5000, designation: "State Park" },
  { name: "Illinois Beach State Park", state: "IL", lat: 42.4333, lng: -87.8000, designation: "State Park" },
  { name: "Cahokia Mounds State Historic Site", state: "IL", lat: 38.6553, lng: -90.0619, designation: "State Park" },

  // Indiana
  { name: "Brown County State Park", state: "IN", lat: 39.1667, lng: -86.2167, designation: "State Park" },
  { name: "Indiana Dunes State Park", state: "IN", lat: 41.6500, lng: -87.0500, designation: "State Park" },
  { name: "Turkey Run State Park", state: "IN", lat: 39.8833, lng: -87.2167, designation: "State Park" },
  { name: "Pokagon State Park", state: "IN", lat: 41.7167, lng: -85.0167, designation: "State Park" },
  { name: "McCormick's Creek State Park", state: "IN", lat: 39.2833, lng: -86.7333, designation: "State Park" },
  { name: "Clifty Falls State Park", state: "IN", lat: 38.7500, lng: -85.4167, designation: "State Park" },
  { name: "Shades State Park", state: "IN", lat: 39.9333, lng: -87.0833, designation: "State Park" },

  // Iowa
  { name: "Backbone State Park", state: "IA", lat: 42.6167, lng: -91.5667, designation: "State Park" },
  { name: "Maquoketa Caves State Park", state: "IA", lat: 42.0667, lng: -90.7500, designation: "State Park" },
  { name: "Pikes Peak State Park", state: "IA", lat: 43.0167, lng: -91.1833, designation: "State Park" },
  { name: "Ledges State Park", state: "IA", lat: 41.9833, lng: -93.8833, designation: "State Park" },
  { name: "Palisades-Kepler State Park", state: "IA", lat: 41.9000, lng: -91.5000, designation: "State Park" },

  // Kansas
  { name: "Kanopolis State Park", state: "KS", lat: 38.7167, lng: -98.1833, designation: "State Park" },
  { name: "Milford State Park", state: "KS", lat: 39.1000, lng: -96.9333, designation: "State Park" },
  { name: "Tuttle Creek State Park", state: "KS", lat: 39.2667, lng: -96.5833, designation: "State Park" },
  { name: "Clinton State Park", state: "KS", lat: 38.9333, lng: -95.3833, designation: "State Park" },
  { name: "El Dorado State Park", state: "KS", lat: 37.8333, lng: -96.8333, designation: "State Park" },

  // Kentucky
  { name: "Cumberland Falls State Resort Park", state: "KY", lat: 36.8372, lng: -84.3453, designation: "State Park" },
  { name: "Natural Bridge State Resort Park", state: "KY", lat: 37.7750, lng: -83.6833, designation: "State Park" },
  { name: "Carter Caves State Resort Park", state: "KY", lat: 38.3667, lng: -83.1167, designation: "State Park" },
  { name: "Breaks Interstate Park", state: "KY", lat: 37.2833, lng: -82.3000, designation: "State Park" },
  { name: "Pine Mountain State Resort Park", state: "KY", lat: 36.7167, lng: -83.7333, designation: "State Park" },
  { name: "Pennyrile Forest State Resort Park", state: "KY", lat: 37.0833, lng: -87.6333, designation: "State Park" },

  // Louisiana
  { name: "Fontainebleau State Park", state: "LA", lat: 30.3333, lng: -90.0500, designation: "State Park" },
  { name: "Chicot State Park", state: "LA", lat: 30.7833, lng: -92.2667, designation: "State Park" },
  { name: "Lake Bistineau State Park", state: "LA", lat: 32.3167, lng: -93.6500, designation: "State Park" },
  { name: "Sam Houston Jones State Park", state: "LA", lat: 30.3000, lng: -93.2667, designation: "State Park" },
  { name: "Grand Isle State Park", state: "LA", lat: 29.2333, lng: -90.0167, designation: "State Park" },

  // Maine
  { name: "Baxter State Park", state: "ME", lat: 46.0000, lng: -68.9167, designation: "State Park" },
  { name: "Acadia State Park", state: "ME", lat: 44.3386, lng: -68.2733, designation: "State Park" },
  { name: "Camden Hills State Park", state: "ME", lat: 44.2500, lng: -69.0500, designation: "State Park" },
  { name: "Sebago Lake State Park", state: "ME", lat: 43.8833, lng: -70.5667, designation: "State Park" },
  { name: "Grafton Notch State Park", state: "ME", lat: 44.6000, lng: -70.9500, designation: "State Park" },
  { name: "Rangeley Lake State Park", state: "ME", lat: 44.9667, lng: -70.6833, designation: "State Park" },
  { name: "Aroostook State Park", state: "ME", lat: 46.7667, lng: -68.0000, designation: "State Park" },

  // Maryland
  { name: "Assateague State Park", state: "MD", lat: 38.2167, lng: -75.1500, designation: "State Park" },
  { name: "Cunningham Falls State Park", state: "MD", lat: 39.6333, lng: -77.4667, designation: "State Park" },
  { name: "Patapsco Valley State Park", state: "MD", lat: 39.2833, lng: -76.7500, designation: "State Park" },
  { name: "Swallow Falls State Park", state: "MD", lat: 39.5000, lng: -79.4167, designation: "State Park" },
  { name: "Deep Creek Lake State Park", state: "MD", lat: 39.5167, lng: -79.3167, designation: "State Park" },
  { name: "Rocks State Park", state: "MD", lat: 39.6333, lng: -76.4167, designation: "State Park" },
  { name: "Calvert Cliffs State Park", state: "MD", lat: 38.3833, lng: -76.4500, designation: "State Park" },

  // Massachusetts
  { name: "Mount Greylock State Reservation", state: "MA", lat: 42.6375, lng: -73.1667, designation: "State Park" },
  { name: "Walden Pond State Reservation", state: "MA", lat: 42.4400, lng: -71.3353, designation: "State Park" },
  { name: "Harold Parker State Forest", state: "MA", lat: 42.6333, lng: -71.0833, designation: "State Forest" },
  { name: "Myles Standish State Forest", state: "MA", lat: 41.8500, lng: -70.7000, designation: "State Forest" },
  { name: "Mount Tom State Reservation", state: "MA", lat: 42.2500, lng: -72.6333, designation: "State Park" },
  { name: "Nickerson State Park", state: "MA", lat: 41.7667, lng: -70.0333, designation: "State Park" },

  // Michigan
  { name: "Porcupine Mountains Wilderness State Park", state: "MI", lat: 46.7833, lng: -89.7833, designation: "State Park" },
  { name: "Tahquamenon Falls State Park", state: "MI", lat: 46.5833, lng: -85.2500, designation: "State Park" },
  { name: "Pictured Rocks State Park", state: "MI", lat: 46.5500, lng: -86.3167, designation: "State Park" },
  { name: "Sleeping Bear Dunes State Park", state: "MI", lat: 44.8667, lng: -86.0500, designation: "State Park" },
  { name: "Ludington State Park", state: "MI", lat: 44.0333, lng: -86.5000, designation: "State Park" },
  { name: "Holland State Park", state: "MI", lat: 42.7833, lng: -86.2000, designation: "State Park" },
  { name: "Warren Dunes State Park", state: "MI", lat: 41.9000, lng: -86.6000, designation: "State Park" },
  { name: "Hartwick Pines State Park", state: "MI", lat: 44.7500, lng: -84.6500, designation: "State Park" },
  { name: "Muskegon State Park", state: "MI", lat: 43.2500, lng: -86.3333, designation: "State Park" },
  { name: "Wilderness State Park", state: "MI", lat: 45.7333, lng: -84.9167, designation: "State Park" },

  // Minnesota
  { name: "Itasca State Park", state: "MN", lat: 47.2167, lng: -95.1833, designation: "State Park" },
  { name: "Gooseberry Falls State Park", state: "MN", lat: 47.1500, lng: -91.4667, designation: "State Park" },
  { name: "Tettegouche State Park", state: "MN", lat: 47.3333, lng: -91.2000, designation: "State Park" },
  { name: "Split Rock Lighthouse State Park", state: "MN", lat: 47.2000, lng: -91.3667, designation: "State Park" },
  { name: "Interstate State Park", state: "MN", lat: 45.4000, lng: -92.6667, designation: "State Park" },
  { name: "Jay Cooke State Park", state: "MN", lat: 46.6500, lng: -92.3667, designation: "State Park" },
  { name: "Fort Snelling State Park", state: "MN", lat: 44.8833, lng: -93.1833, designation: "State Park" },
  { name: "Minneopa State Park", state: "MN", lat: 44.1500, lng: -94.1000, designation: "State Park" },

  // Mississippi
  { name: "Tishomingo State Park", state: "MS", lat: 34.6167, lng: -88.2000, designation: "State Park" },
  { name: "Roosevelt State Park", state: "MS", lat: 32.4000, lng: -89.1833, designation: "State Park" },
  { name: "Percy Quin State Park", state: "MS", lat: 31.1167, lng: -90.4667, designation: "State Park" },
  { name: "Wall Doxey State Park", state: "MS", lat: 34.6333, lng: -89.5500, designation: "State Park" },
  { name: "Clark Creek Natural Area", state: "MS", lat: 31.0500, lng: -91.1500, designation: "State Natural Area" },

  // Missouri
  { name: "Ha Ha Tonka State Park", state: "MO", lat: 37.9833, lng: -92.7667, designation: "State Park" },
  { name: "Johnson's Shut-Ins State Park", state: "MO", lat: 37.5500, lng: -90.8500, designation: "State Park" },
  { name: "Elephant Rocks State Park", state: "MO", lat: 37.6167, lng: -90.6833, designation: "State Park" },
  { name: "Meramec State Park", state: "MO", lat: 38.2000, lng: -91.1000, designation: "State Park" },
  { name: "Roaring River State Park", state: "MO", lat: 36.5833, lng: -93.8333, designation: "State Park" },
  { name: "Table Rock State Park", state: "MO", lat: 36.5833, lng: -93.3167, designation: "State Park" },
  { name: "Bennett Spring State Park", state: "MO", lat: 37.7167, lng: -92.8500, designation: "State Park" },
  { name: "Lake of the Ozarks State Park", state: "MO", lat: 38.0833, lng: -92.6167, designation: "State Park" },

  // Montana
  { name: "Glacier State Park", state: "MT", lat: 48.7596, lng: -113.7870, designation: "State Park" },
  { name: "Makoshika State Park", state: "MT", lat: 47.0833, lng: -104.7167, designation: "State Park" },
  { name: "Lewis and Clark Caverns State Park", state: "MT", lat: 45.8333, lng: -111.8667, designation: "State Park" },
  { name: "Giant Springs State Park", state: "MT", lat: 47.5167, lng: -111.2333, designation: "State Park" },
  { name: "Flathead Lake State Park", state: "MT", lat: 47.8833, lng: -114.1500, designation: "State Park" },

  // Nebraska
  { name: "Chadron State Park", state: "NE", lat: 42.6667, lng: -103.0000, designation: "State Park" },
  { name: "Fort Robinson State Park", state: "NE", lat: 42.6667, lng: -103.4667, designation: "State Park" },
  { name: "Ponca State Park", state: "NE", lat: 42.6000, lng: -96.7167, designation: "State Park" },
  { name: "Indian Cave State Park", state: "NE", lat: 40.2500, lng: -95.5333, designation: "State Park" },
  { name: "Platte River State Park", state: "NE", lat: 41.0167, lng: -96.2333, designation: "State Park" },

  // Nevada
  { name: "Valley of Fire State Park", state: "NV", lat: 36.4333, lng: -114.5167, designation: "State Park" },
  { name: "Lake Tahoe Nevada State Park", state: "NV", lat: 39.1833, lng: -119.9333, designation: "State Park" },
  { name: "Cathedral Gorge State Park", state: "NV", lat: 37.8167, lng: -114.4167, designation: "State Park" },
  { name: "Berlin-Ichthyosaur State Park", state: "NV", lat: 38.8833, lng: -117.6000, designation: "State Park" },
  { name: "Spring Mountain Ranch State Park", state: "NV", lat: 36.0667, lng: -115.4500, designation: "State Park" },
  { name: "Kershaw-Ryan State Park", state: "NV", lat: 37.9500, lng: -114.4000, designation: "State Park" },

  // New Hampshire
  { name: "Franconia Notch State Park", state: "NH", lat: 44.1500, lng: -71.6833, designation: "State Park" },
  { name: "Mount Washington State Park", state: "NH", lat: 44.2708, lng: -71.3033, designation: "State Park" },
  { name: "Crawford Notch State Park", state: "NH", lat: 44.1833, lng: -71.4000, designation: "State Park" },
  { name: "Monadnock State Park", state: "NH", lat: 42.8500, lng: -72.1167, designation: "State Park" },
  { name: "Pawtuckaway State Park", state: "NH", lat: 43.0833, lng: -71.1667, designation: "State Park" },
  { name: "Wellington State Park", state: "NH", lat: 43.6500, lng: -71.7833, designation: "State Park" },
  { name: "Odiorne Point State Park", state: "NH", lat: 43.0500, lng: -70.7167, designation: "State Park" },

  // New Jersey
  { name: "Wharton State Forest", state: "NJ", lat: 39.6667, lng: -74.7500, designation: "State Forest" },
  { name: "Stokes State Forest", state: "NJ", lat: 41.2333, lng: -74.7667, designation: "State Forest" },
  { name: "High Point State Park", state: "NJ", lat: 41.3000, lng: -74.6667, designation: "State Park" },
  { name: "Island Beach State Park", state: "NJ", lat: 39.8000, lng: -74.0833, designation: "State Park" },
  { name: "Ringwood State Park", state: "NJ", lat: 41.1167, lng: -74.2833, designation: "State Park" },
  { name: "Bass River State Forest", state: "NJ", lat: 39.6333, lng: -74.4333, designation: "State Forest" },
  { name: "Worthington State Forest", state: "NJ", lat: 41.0500, lng: -75.0833, designation: "State Forest" },

  // New Mexico
  { name: "Carlsbad Caverns State Park", state: "NM", lat: 32.1478, lng: -104.5567, designation: "State Park" },
  { name: "City of Rocks State Park", state: "NM", lat: 32.6167, lng: -107.9833, designation: "State Park" },
  { name: "Elephant Butte Lake State Park", state: "NM", lat: 33.1833, lng: -107.2000, designation: "State Park" },
  { name: "Bottomless Lakes State Park", state: "NM", lat: 33.3333, lng: -104.3333, designation: "State Park" },
  { name: "Hyde Memorial State Park", state: "NM", lat: 35.7333, lng: -105.8333, designation: "State Park" },
  { name: "Sugarite Canyon State Park", state: "NM", lat: 36.9333, lng: -104.4000, designation: "State Park" },

  // New York
  { name: "Letchworth State Park", state: "NY", lat: 42.5833, lng: -78.0000, designation: "State Park" },
  { name: "Watkins Glen State Park", state: "NY", lat: 42.3667, lng: -76.8667, designation: "State Park" },
  { name: "Harriman State Park", state: "NY", lat: 41.2333, lng: -74.0833, designation: "State Park" },
  { name: "Niagara Falls State Park", state: "NY", lat: 43.0833, lng: -79.0667, designation: "State Park" },
  { name: "Minnewaska State Park Preserve", state: "NY", lat: 41.7333, lng: -74.2333, designation: "State Park" },
  { name: "Adirondack State Park", state: "NY", lat: 44.0000, lng: -74.2500, designation: "State Park" },
  { name: "Allegany State Park", state: "NY", lat: 42.0667, lng: -78.7500, designation: "State Park" },
  { name: "Robert Treman State Park", state: "NY", lat: 42.3833, lng: -76.5500, designation: "State Park" },
  { name: "Taughannock Falls State Park", state: "NY", lat: 42.5333, lng: -76.6167, designation: "State Park" },
  { name: "Buttermilk Falls State Park", state: "NY", lat: 42.4167, lng: -76.5333, designation: "State Park" },

  // North Carolina
  { name: "Hanging Rock State Park", state: "NC", lat: 36.3917, lng: -80.2639, designation: "State Park" },
  { name: "Stone Mountain State Park", state: "NC", lat: 36.3833, lng: -81.0333, designation: "State Park" },
  { name: "Chimney Rock State Park", state: "NC", lat: 35.4333, lng: -82.2500, designation: "State Park" },
  { name: "Pilot Mountain State Park", state: "NC", lat: 36.3500, lng: -80.4667, designation: "State Park" },
  { name: "South Mountains State Park", state: "NC", lat: 35.5833, lng: -81.6333, designation: "State Park" },
  { name: "Eno River State Park", state: "NC", lat: 36.0667, lng: -79.0000, designation: "State Park" },
  { name: "Mount Mitchell State Park", state: "NC", lat: 35.7650, lng: -82.2650, designation: "State Park" },
  { name: "Grandfather Mountain State Park", state: "NC", lat: 36.1000, lng: -81.8333, designation: "State Park" },
  { name: "Gorges State Park", state: "NC", lat: 35.1000, lng: -82.9500, designation: "State Park" },
  { name: "Carolina Beach State Park", state: "NC", lat: 34.0500, lng: -77.9167, designation: "State Park" },

  // North Dakota
  { name: "Theodore Roosevelt State Park", state: "ND", lat: 47.0000, lng: -103.4500, designation: "State Park" },
  { name: "Fort Abraham Lincoln State Park", state: "ND", lat: 46.7667, lng: -100.8167, designation: "State Park" },
  { name: "Lake Sakakawea State Park", state: "ND", lat: 47.5667, lng: -101.6500, designation: "State Park" },
  { name: "Turtle River State Park", state: "ND", lat: 47.9833, lng: -97.5333, designation: "State Park" },
  { name: "Icelandic State Park", state: "ND", lat: 48.7833, lng: -97.7000, designation: "State Park" },

  // Ohio
  { name: "Hocking Hills State Park", state: "OH", lat: 39.4333, lng: -82.5333, designation: "State Park" },
  { name: "Cuyahoga Valley State Park", state: "OH", lat: 41.2500, lng: -81.5500, designation: "State Park" },
  { name: "Mohican State Park", state: "OH", lat: 40.6167, lng: -82.3000, designation: "State Park" },
  { name: "Salt Fork State Park", state: "OH", lat: 40.1167, lng: -81.5167, designation: "State Park" },
  { name: "John Bryan State Park", state: "OH", lat: 39.7833, lng: -83.8500, designation: "State Park" },
  { name: "Malabar Farm State Park", state: "OH", lat: 40.6667, lng: -82.3833, designation: "State Park" },
  { name: "Caesar Creek State Park", state: "OH", lat: 39.5000, lng: -84.0500, designation: "State Park" },
  { name: "Alum Creek State Park", state: "OH", lat: 40.2000, lng: -82.9500, designation: "State Park" },

  // Oklahoma
  { name: "Turner Falls Park", state: "OK", lat: 34.4167, lng: -97.1500, designation: "State Park" },
  { name: "Beavers Bend State Park", state: "OK", lat: 34.1333, lng: -94.7167, designation: "State Park" },
  { name: "Robbers Cave State Park", state: "OK", lat: 34.9333, lng: -95.3500, designation: "State Park" },
  { name: "Natural Falls State Park", state: "OK", lat: 36.3667, lng: -94.7500, designation: "State Park" },
  { name: "Roman Nose State Park", state: "OK", lat: 36.0500, lng: -98.4333, designation: "State Park" },
  { name: "Quartz Mountain State Park", state: "OK", lat: 34.9000, lng: -99.3000, designation: "State Park" },

  // Oregon
  { name: "Silver Falls State Park", state: "OR", lat: 44.8833, lng: -122.6500, designation: "State Park" },
  { name: "Crater Lake State Park", state: "OR", lat: 42.9417, lng: -122.1083, designation: "State Park" },
  { name: "Smith Rock State Park", state: "OR", lat: 44.3667, lng: -121.1333, designation: "State Park" },
  { name: "Ecola State Park", state: "OR", lat: 45.9167, lng: -123.9833, designation: "State Park" },
  { name: "Cape Lookout State Park", state: "OR", lat: 45.3333, lng: -123.9667, designation: "State Park" },
  { name: "Oswald West State Park", state: "OR", lat: 45.7667, lng: -123.9667, designation: "State Park" },
  { name: "Shore Acres State Park", state: "OR", lat: 43.3333, lng: -124.3833, designation: "State Park" },
  { name: "Tryon Creek State Natural Area", state: "OR", lat: 45.4333, lng: -122.6833, designation: "State Natural Area" },
  { name: "Fort Stevens State Park", state: "OR", lat: 46.2000, lng: -123.9667, designation: "State Park" },
  { name: "Tumalo State Park", state: "OR", lat: 44.1333, lng: -121.3333, designation: "State Park" },

  // Pennsylvania
  { name: "Ricketts Glen State Park", state: "PA", lat: 41.3167, lng: -76.2833, designation: "State Park" },
  { name: "Ohiopyle State Park", state: "PA", lat: 39.8667, lng: -79.5000, designation: "State Park" },
  { name: "Presque Isle State Park", state: "PA", lat: 42.1500, lng: -80.1167, designation: "State Park" },
  { name: "Hickory Run State Park", state: "PA", lat: 41.0333, lng: -75.7000, designation: "State Park" },
  { name: "Worlds End State Park", state: "PA", lat: 41.4667, lng: -76.5667, designation: "State Park" },
  { name: "Pine Grove Furnace State Park", state: "PA", lat: 40.0333, lng: -77.3000, designation: "State Park" },
  { name: "Promised Land State Park", state: "PA", lat: 41.3167, lng: -75.2167, designation: "State Park" },
  { name: "Leonard Harrison State Park", state: "PA", lat: 41.7000, lng: -77.4500, designation: "State Park" },
  { name: "Laurel Hill State Park", state: "PA", lat: 40.0167, lng: -79.2500, designation: "State Park" },
  { name: "Cook Forest State Park", state: "PA", lat: 41.3333, lng: -79.2167, designation: "State Park" },

  // Rhode Island
  { name: "Colt State Park", state: "RI", lat: 41.6667, lng: -71.2833, designation: "State Park" },
  { name: "Lincoln Woods State Park", state: "RI", lat: 41.8833, lng: -71.4333, designation: "State Park" },
  { name: "Burlingame State Park", state: "RI", lat: 41.3833, lng: -71.7000, designation: "State Park" },
  { name: "Beavertail State Park", state: "RI", lat: 41.4500, lng: -71.4000, designation: "State Park" },
  { name: "Goddard Memorial State Park", state: "RI", lat: 41.6833, lng: -71.4333, designation: "State Park" },

  // South Carolina
  { name: "Table Rock State Park", state: "SC", lat: 35.0333, lng: -82.7167, designation: "State Park" },
  { name: "Caesars Head State Park", state: "SC", lat: 35.1000, lng: -82.6333, designation: "State Park" },
  { name: "Hunting Island State Park", state: "SC", lat: 32.3667, lng: -80.4500, designation: "State Park" },
  { name: "Edisto Beach State Park", state: "SC", lat: 32.4833, lng: -80.3000, designation: "State Park" },
  { name: "Huntington Beach State Park", state: "SC", lat: 33.5167, lng: -79.0667, designation: "State Park" },
  { name: "Devils Fork State Park", state: "SC", lat: 34.9500, lng: -82.9500, designation: "State Park" },
  { name: "Paris Mountain State Park", state: "SC", lat: 34.9333, lng: -82.3833, designation: "State Park" },
  { name: "Myrtle Beach State Park", state: "SC", lat: 33.6500, lng: -78.9333, designation: "State Park" },

  // South Dakota
  { name: "Custer State Park", state: "SD", lat: 43.7667, lng: -103.4333, designation: "State Park" },
  { name: "Palisades State Park", state: "SD", lat: 43.8833, lng: -96.5167, designation: "State Park" },
  { name: "Lewis and Clark Recreation Area", state: "SD", lat: 42.8833, lng: -97.4500, designation: "State Recreation Area" },
  { name: "Bear Butte State Park", state: "SD", lat: 44.4833, lng: -103.4167, designation: "State Park" },
  { name: "Good Earth State Park", state: "SD", lat: 43.4667, lng: -96.6167, designation: "State Park" },

  // Tennessee
  { name: "Fall Creek Falls State Park", state: "TN", lat: 35.6667, lng: -85.3500, designation: "State Park" },
  { name: "Burgess Falls State Park", state: "TN", lat: 36.0500, lng: -85.6000, designation: "State Park" },
  { name: "Rock Island State Park", state: "TN", lat: 35.8000, lng: -85.6333, designation: "State Park" },
  { name: "Savage Gulf State Natural Area", state: "TN", lat: 35.4500, lng: -85.6333, designation: "State Natural Area" },
  { name: "Roan Mountain State Park", state: "TN", lat: 36.1667, lng: -82.1167, designation: "State Park" },
  { name: "Cummins Falls State Park", state: "TN", lat: 36.2500, lng: -85.5833, designation: "State Park" },
  { name: "Big Ridge State Park", state: "TN", lat: 36.2500, lng: -84.0000, designation: "State Park" },
  { name: "Natchez Trace State Park", state: "TN", lat: 35.6667, lng: -88.3000, designation: "State Park" },
  { name: "Radnor Lake State Park", state: "TN", lat: 36.0667, lng: -86.8000, designation: "State Park" },

  // Texas
  { name: "Big Bend Ranch State Park", state: "TX", lat: 29.4667, lng: -103.9500, designation: "State Park" },
  { name: "Enchanted Rock State Natural Area", state: "TX", lat: 30.5000, lng: -98.8167, designation: "State Natural Area" },
  { name: "Palo Duro Canyon State Park", state: "TX", lat: 34.9333, lng: -101.6667, designation: "State Park" },
  { name: "Garner State Park", state: "TX", lat: 29.5833, lng: -99.7500, designation: "State Park" },
  { name: "Pedernales Falls State Park", state: "TX", lat: 30.3167, lng: -98.2667, designation: "State Park" },
  { name: "Lost Maples State Natural Area", state: "TX", lat: 29.8167, lng: -99.5833, designation: "State Natural Area" },
  { name: "Caprock Canyons State Park", state: "TX", lat: 34.4333, lng: -101.0500, designation: "State Park" },
  { name: "Guadalupe River State Park", state: "TX", lat: 29.8667, lng: -98.5000, designation: "State Park" },
  { name: "Colorado Bend State Park", state: "TX", lat: 31.0333, lng: -98.4333, designation: "State Park" },
  { name: "McKinney Falls State Park", state: "TX", lat: 30.1833, lng: -97.7167, designation: "State Park" },
  { name: "Davis Mountains State Park", state: "TX", lat: 30.6000, lng: -103.9333, designation: "State Park" },
  { name: "Brazos Bend State Park", state: "TX", lat: 29.3833, lng: -95.6333, designation: "State Park" },
  { name: "Inks Lake State Park", state: "TX", lat: 30.7333, lng: -98.3667, designation: "State Park" },

  // Utah
  { name: "Snow Canyon State Park", state: "UT", lat: 37.2000, lng: -113.6333, designation: "State Park" },
  { name: "Dead Horse Point State Park", state: "UT", lat: 38.4833, lng: -109.7333, designation: "State Park" },
  { name: "Goblin Valley State Park", state: "UT", lat: 38.5667, lng: -110.7000, designation: "State Park" },
  { name: "Antelope Island State Park", state: "UT", lat: 41.0333, lng: -112.2500, designation: "State Park" },
  { name: "Kodachrome Basin State Park", state: "UT", lat: 37.5000, lng: -111.9833, designation: "State Park" },
  { name: "Coral Pink Sand Dunes State Park", state: "UT", lat: 37.0333, lng: -112.7167, designation: "State Park" },
  { name: "Fremont Indian State Park", state: "UT", lat: 38.5833, lng: -112.3333, designation: "State Park" },
  { name: "Wasatch Mountain State Park", state: "UT", lat: 40.5500, lng: -111.5000, designation: "State Park" },

  // Vermont
  { name: "Mount Mansfield State Forest", state: "VT", lat: 44.5333, lng: -72.8167, designation: "State Forest" },
  { name: "Smugglers Notch State Park", state: "VT", lat: 44.5500, lng: -72.7833, designation: "State Park" },
  { name: "Groton State Forest", state: "VT", lat: 44.2833, lng: -72.2667, designation: "State Forest" },
  { name: "Camel's Hump State Park", state: "VT", lat: 44.3167, lng: -72.8833, designation: "State Park" },
  { name: "Jamaica State Park", state: "VT", lat: 43.1000, lng: -72.7833, designation: "State Park" },
  { name: "Quechee State Park", state: "VT", lat: 43.6333, lng: -72.4167, designation: "State Park" },
  { name: "Burton Island State Park", state: "VT", lat: 44.7833, lng: -73.2333, designation: "State Park" },

  // Virginia
  { name: "Shenandoah River State Park", state: "VA", lat: 38.9167, lng: -78.3167, designation: "State Park" },
  { name: "Grayson Highlands State Park", state: "VA", lat: 36.6333, lng: -81.5167, designation: "State Park" },
  { name: "First Landing State Park", state: "VA", lat: 36.9167, lng: -76.0333, designation: "State Park" },
  { name: "Hungry Mother State Park", state: "VA", lat: 36.8833, lng: -81.5333, designation: "State Park" },
  { name: "Douthat State Park", state: "VA", lat: 37.9000, lng: -79.8167, designation: "State Park" },
  { name: "Natural Bridge State Park", state: "VA", lat: 37.6333, lng: -79.5500, designation: "State Park" },
  { name: "Sky Meadows State Park", state: "VA", lat: 38.9833, lng: -77.9667, designation: "State Park" },
  { name: "Pocahontas State Park", state: "VA", lat: 37.3833, lng: -77.5667, designation: "State Park" },
  { name: "False Cape State Park", state: "VA", lat: 36.6167, lng: -75.9333, designation: "State Park" },

  // Washington
  { name: "Deception Pass State Park", state: "WA", lat: 48.4000, lng: -122.6500, designation: "State Park" },
  { name: "Mount Rainier State Park", state: "WA", lat: 46.8800, lng: -121.7269, designation: "State Park" },
  { name: "Palouse Falls State Park", state: "WA", lat: 46.6667, lng: -118.2333, designation: "State Park" },
  { name: "Moran State Park", state: "WA", lat: 48.6667, lng: -122.8333, designation: "State Park" },
  { name: "Cape Disappointment State Park", state: "WA", lat: 46.2833, lng: -124.0500, designation: "State Park" },
  { name: "Lime Kiln Point State Park", state: "WA", lat: 48.5167, lng: -123.1500, designation: "State Park" },
  { name: "Beacon Rock State Park", state: "WA", lat: 45.6333, lng: -122.0167, designation: "State Park" },
  { name: "Lake Chelan State Park", state: "WA", lat: 47.8500, lng: -120.1833, designation: "State Park" },
  { name: "Sun Lakes-Dry Falls State Park", state: "WA", lat: 47.5833, lng: -119.3833, designation: "State Park" },
  { name: "Riverside State Park", state: "WA", lat: 47.7667, lng: -117.4833, designation: "State Park" },

  // West Virginia
  { name: "Blackwater Falls State Park", state: "WV", lat: 39.1167, lng: -79.4833, designation: "State Park" },
  { name: "Coopers Rock State Forest", state: "WV", lat: 39.6500, lng: -79.8000, designation: "State Forest" },
  { name: "Lost River State Park", state: "WV", lat: 39.0833, lng: -78.9000, designation: "State Park" },
  { name: "Seneca Rocks State Park", state: "WV", lat: 38.8333, lng: -79.3667, designation: "State Park" },
  { name: "Hawks Nest State Park", state: "WV", lat: 38.1167, lng: -81.1167, designation: "State Park" },
  { name: "Cacapon Resort State Park", state: "WV", lat: 39.5000, lng: -78.3167, designation: "State Park" },
  { name: "Babcock State Park", state: "WV", lat: 38.0167, lng: -80.9500, designation: "State Park" },
  { name: "Cathedral State Park", state: "WV", lat: 39.3167, lng: -79.5667, designation: "State Park" },

  // Wisconsin
  { name: "Devil's Lake State Park", state: "WI", lat: 43.4167, lng: -89.7333, designation: "State Park" },
  { name: "Peninsula State Park", state: "WI", lat: 45.1833, lng: -87.2167, designation: "State Park" },
  { name: "Governor Dodge State Park", state: "WI", lat: 43.0167, lng: -90.1167, designation: "State Park" },
  { name: "Willow River State Park", state: "WI", lat: 45.0333, lng: -92.6333, designation: "State Park" },
  { name: "Wyalusing State Park", state: "WI", lat: 43.0000, lng: -91.1167, designation: "State Park" },
  { name: "Copper Falls State Park", state: "WI", lat: 46.3667, lng: -90.6333, designation: "State Park" },
  { name: "Interstate State Park", state: "WI", lat: 45.4000, lng: -92.6667, designation: "State Park" },
  { name: "Big Bay State Park", state: "WI", lat: 46.7833, lng: -90.6833, designation: "State Park" },
  { name: "Amnicon Falls State Park", state: "WI", lat: 46.6167, lng: -91.8833, designation: "State Park" },
  { name: "Potawatomi State Park", state: "WI", lat: 44.8667, lng: -87.3333, designation: "State Park" },

  // Wyoming
  { name: "Curt Gowdy State Park", state: "WY", lat: 41.1667, lng: -105.2333, designation: "State Park" },
  { name: "Glendo State Park", state: "WY", lat: 42.4833, lng: -104.9500, designation: "State Park" },
  { name: "Boysen State Park", state: "WY", lat: 43.4167, lng: -108.1833, designation: "State Park" },
  { name: "Keyhole State Park", state: "WY", lat: 44.3667, lng: -104.8167, designation: "State Park" },
  { name: "Guernsey State Park", state: "WY", lat: 42.2667, lng: -104.7500, designation: "State Park" },
  { name: "Sinks Canyon State Park", state: "WY", lat: 42.7333, lng: -108.8333, designation: "State Park" },
];

// Convert raw data to Park objects
export function getStaticStateParks(): Park[] {
  return STATE_PARKS_DATA.map((park, index) => ({
    id: `static_${park.state.toLowerCase()}_${index}`,
    source: 'state' as const,
    fullName: park.name,
    description: '',
    stateCodes: park.state,
    latitude: park.lat,
    longitude: park.lng,
    designation: park.designation,
    imageUrl: null,
    rawJson: '',
    lastSynced: Date.now(),
  }));
}

export const STATE_PARK_COUNT = STATE_PARKS_DATA.length;
