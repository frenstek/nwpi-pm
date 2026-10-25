export const CATEGORIES = [
  {
    id: 'client',
    title: 'Client Information',
    icon: 'user',
    items: [
      { id: 'clientName', label: 'Client Name', type: 'text' },
      { id: 'email', label: 'Email Address', type: 'text' },
      { id: 'mobile', label: 'Mobile Number', type: 'text' },
      { id: 'siteAddress', label: 'Site Address', type: 'text' },
      { id: 'lotNumber', label: 'Lot Number', type: 'text' },
      { id: 'validUntil', label: 'Quote Valid Until', type: 'date' },
    ]
  },
  {
    id: 'preliminaries',
    title: 'Preliminaries',
    icon: 'clipboard',
    items: [
      { id: 'planProvided', label: 'Plan Provided by Client', type: 'choice', standard: 'No', upgrade: 'Yes', standardLabel: 'No', upgradeLabel: 'Yes' },
      { id: 'demolitionRequired', label: 'Demolition Required', type: 'choice', standard: 'No', upgrade: 'Yes', standardLabel: 'No', upgradeLabel: 'Yes', hasWriteIn: true, writeInLabel: 'Demolition details (existing structure, scope, etc.)' },
      { id: 'demolitionDescription', label: 'Demolition Description (for client)', type: 'textarea', defaultValue: 'Commencement of work will take place upon approval and arrival of relevant Permits, the asset protection permit is to be supplied and paid for by the owner (prior to demolition).\n\nAll demolition work is according to OHS and Work Safe rules and regulations. All debris to be removed and disposed of to the appropriate tip. Throughout the demolition the site shall be secured at all times and the structure to be demolished and all its components shall be maintained in a safe and stable condition at all stages of the demolition work. On completion of the demolition works, the site will be cleared of all demolition debris and left in a safe and secure state and a 50% deposit is required.\n\nDemolition permit: I would need a copy of the title no more than three months old, sec 29a, existing site plan showing the house to be demolished and asset protection permit stating demolition, then I will apply for the permit upon receiving the documents.' },
      { id: 'demolitionPrice', label: 'Demolition Price ($)', type: 'text', placeholder: 'e.g. 15000' },
    ]
  },
  {
    id: 'buildType',
    title: 'Build Type',
    icon: 'building',
    items: [
      { id: 'constructionType', label: 'Construction Type', type: 'options', options: [
        { id: 'ndis_custom', label: 'NDIS Custom Built' },
        { id: 'modular', label: 'Modular Build (Panellock)' },
        { id: 'standard', label: 'Standard Built' },
        { id: 'custom', label: 'Custom Built' },
      ]},
      { id: 'storeyType', label: 'Storey Type', type: 'choice', standard: 'Single Storey', upgrade: 'Double Storey' },
      { id: 'projectType', label: 'Project Type', type: 'options', options: [
        { id: 'conventional', label: 'Conventional' },
        { id: 'ndis_sda', label: 'NDIS SDA Home' },
        { id: 'modular_sda', label: 'Modular SDA Home' },
        { id: 'custom', label: 'Custom' },
      ]},
      { id: 'customProjectType', label: 'Custom Project Type', type: 'text', placeholder: 'Describe custom project type...' },
      { id: 'propertyType', label: 'Property Type', type: 'options', options: [
        { id: 'house', label: 'House' },
        { id: 'townhouse', label: 'Townhouse' },
        { id: 'villa', label: 'Villa' },
        { id: 'duplex', label: 'Duplex' },
      ]},
    ]
  },
  {
    id: 'sda',
    title: 'SDA Requirements',
    icon: 'shield',
    items: [
      { id: 'sdaRequired', label: 'SDA Requirements Applicable?', type: 'choice', standard: 'No', upgrade: 'Yes', standardLabel: 'No - Skip', upgradeLabel: 'Yes - SDA Required' },
      { id: 'fullyAccessible', label: 'Fully Accessible (F.A.)', type: 'choice', standard: 'No', upgrade: 'Yes', standardLabel: 'No', upgradeLabel: 'Yes', dependsOn: { field: 'sdaRequired', value: 'upg' } },
      { id: 'improvedLiveability', label: 'Improved Liveability', type: 'choice', standard: 'No', upgrade: 'Yes', standardLabel: 'No', upgradeLabel: 'Yes', dependsOn: { field: 'sdaRequired', value: 'upg' } },
      { id: 'robust', label: 'Robust', type: 'choice', standard: 'No', upgrade: 'Yes', standardLabel: 'No', upgradeLabel: 'Yes', dependsOn: { field: 'sdaRequired', value: 'upg' } },
      { id: 'highPhysicalSupport', label: 'High Physical Support', type: 'choice', standard: 'No', upgrade: 'Yes', standardLabel: 'No', upgradeLabel: 'Yes', dependsOn: { field: 'sdaRequired', value: 'upg' } },
      { id: 'fireSprinkler', label: 'Fire Sprinkler System', type: 'choice', standard: 'Not included', upgrade: 'Fire sprinkler system required', standardLabel: 'No', upgradeLabel: 'Yes', hasWriteIn: true, writeInLabel: 'Sprinkler system details / requirements', dependsOn: { field: 'sdaRequired', value: 'upg' } },
      { id: 'fireSprinklerPrice', label: 'Fire Sprinkler Price ($)', type: 'text', placeholder: 'e.g. 8000', dependsOn: { field: 'sdaRequired', value: 'upg' } },
      { id: 'sdaNotes', label: 'SDA Additional Notes', type: 'textarea', dependsOn: { field: 'sdaRequired', value: 'upg' } },
    ]
  },
  {
    id: 'project',
    title: 'Project Details',
    icon: 'blueprint',
    items: [
      { id: 'landSize', label: 'Land Size (m\u00B2)', type: 'text', placeholder: 'e.g. 450' },
      { id: 'bedrooms', label: 'Number of Bedrooms', type: 'text', placeholder: 'e.g. 4' },
      { id: 'bathrooms', label: 'Number of Bathrooms', type: 'text', placeholder: 'e.g. 2' },
      { id: 'livingAreas', label: 'Number of Living Areas', type: 'text', placeholder: 'e.g. 2' },
      { id: 'garageSize', label: 'Garage', type: 'options', hasWriteIn: true, writeInLabel: 'Add a note about the garage...', options: [
        { id: 'none', label: 'No Garage' },
        { id: 'single', label: 'Single Garage' },
        { id: 'double', label: 'Double Garage' },
        { id: 'insulated', label: 'Cladding Garage' },
      ]},
      { id: 'carport', label: 'Carport', type: 'choice', standard: 'Not included', upgrade: 'Included', standardLabel: 'No', upgradeLabel: 'Yes', hasWriteIn: true, writeInLabel: 'Carport details (e.g. single, double, attached)' },
      { id: 'carpark', label: 'Car Park Space', type: 'choice', standard: 'Not included', upgrade: 'Included', standardLabel: 'No', upgradeLabel: 'Yes', hasWriteIn: true, writeInLabel: 'Car park details (e.g. number of spaces)' },
      { id: 'powderRoom', label: 'Powder Room', type: 'choice', standard: 'Not included', upgrade: 'Included', standardLabel: 'No', upgradeLabel: 'Yes' },
      { id: 'buildArea', label: 'Building Area (m\u00B2)', type: 'text', placeholder: 'Total building area' },
      { id: 'dwelling', label: 'Dwelling', type: 'options', multiSelect: true, options: [
        { id: 'single', label: 'Dwelling One' },
        { id: 'dual', label: 'Dwelling Two' },
      ]},
      { id: 'carerRoom', label: 'Carer Room', type: 'choice', standard: 'Not included', upgrade: 'Included', standardLabel: 'No', upgradeLabel: 'Yes' },
      { id: 'floorPlan', label: 'Floor Plan Reference', type: 'text', placeholder: 'Plan name or number' },
    ]
  },
  {
    id: 'site',
    title: 'Site & Foundation',
    icon: 'foundation',
    items: [
      { id: 'soilClass', label: 'Soil Classification', type: 'choice', standard: 'Up to Class H2', upgrade: 'P Class / reactive soil', hasWriteIn: true, writeInLabel: 'Soil class if known' },
      { id: 'slabType', label: 'Slab Type', type: 'choice', standard: 'Waffle pod slab (engineer designed)', upgrade: 'Raft slab / pier & beam' },
      { id: 'siteMaxFall', label: 'Site Fall', type: 'options', options: [
        { id: 'up_to_350', label: 'Up to 350mm fall' },
        { id: 'over_350', label: 'Greater than 350mm' },
      ]},
      { id: 'siteFallDetail', label: 'Approx Fall (mm)', type: 'text', placeholder: 'e.g. 200' },
      { id: 'sewerConnection', label: 'Sewer Connection', type: 'choice', standard: 'Within building allotment', upgrade: 'Extended sewer connection' },
      { id: 'electricitySupply', label: 'Electricity Supply', type: 'choice', standard: 'Single phase, meter within 6m', upgrade: 'Three phase power', hasWriteIn: true, writeInLabel: 'Meter distance' },
      { id: 'gasConnection', label: 'Gas Connection', type: 'choice', standard: 'Gas connection and fee by client', upgrade: 'No gas (all electric)', standardLabel: 'Yes - by client', upgradeLabel: 'No gas' },
      { id: 'gasMeter', label: 'Gas Meter', type: 'choice', standard: 'Gas meter fit by client', upgrade: 'Not required', standardLabel: 'By client', upgradeLabel: 'N/A' },
      { id: 'retainingWalls', label: 'Retaining Walls', type: 'options', hasWriteIn: true, writeInLabel: 'Add a note about retaining walls...', options: [
        { id: 'client', label: 'By client' },
        { id: 'included', label: 'Included in build' },
        { id: 'asPerPlan', label: 'As per plan provided by client' },
      ]},
      { id: 'bushFire', label: 'Bush Fire Zone', type: 'choice', standard: 'Not in bush fire zone', upgrade: 'Bush fire zone (BAL assessment)', standardLabel: 'No', upgradeLabel: 'Yes' },
    ]
  },
  {
    id: 'facade',
    title: 'Facade & External',
    icon: 'building',
    items: [
      { id: 'facadeStyle', label: 'Facade Style', type: 'options', options: [
        { id: 'builders_range', label: "Builder's range" },
        { id: 'custom', label: 'Custom facade design' },
        { id: 'according_plan', label: 'According to plan' },
      ]},
      { id: 'facadeMaterials', label: 'Facade Materials', type: 'text', placeholder: 'e.g. Brick, cladding, hebel, foam and render' },
      { id: 'brickSelection', label: 'Brick Selection', type: 'choice', standard: "Builder's range", upgrade: 'Premium brick', hasWriteIn: true, writeInLabel: 'Specify brick' },
      { id: 'brickColour', label: 'Brick Colour', type: 'text', placeholder: 'Enter colour' },
      { id: 'mortarColour', label: 'Mortar Colour', type: 'text', placeholder: 'e.g. Off white, natural' },
      { id: 'frontRender', label: 'Front Render', type: 'choice', standard: 'Render to front pillars', upgrade: 'Full front render' },
      { id: 'renderColour', label: 'Render Colour', type: 'text', placeholder: 'Enter colour' },
      { id: 'externalCladding', label: 'External Cladding', type: 'choice', standard: 'Not included', upgrade: 'Fibre cement / feature cladding', standardLabel: 'No', hasWriteIn: true, writeInLabel: 'Type & location' },
      { id: 'roofType', label: 'Roof Type', type: 'choice', standard: "Roof tiles from builder's range", upgrade: 'Colorbond metal roof' },
      { id: 'roofColour', label: 'Roof Colour', type: 'text', placeholder: 'Enter colour' },
      { id: 'roofPitch', label: 'Roof Pitch', type: 'choice', standard: '22.5 degrees', upgrade: 'Increased pitch', hasWriteIn: true, writeInLabel: 'Degrees' },
      { id: 'gutterColour', label: 'Gutter & Fascia Colour', type: 'text', placeholder: 'Colorbond colour' },
      { id: 'eaves', label: 'Eaves', type: 'choice', standard: '450mm front, 2000mm sides', upgrade: 'Extended eaves' },
      { id: 'porchFinish', label: 'Porch Floor Finish', type: 'text', placeholder: 'e.g. Tiled, colour concrete' },
    ]
  },
  {
    id: 'doors',
    title: 'Entry & Doors',
    icon: 'door',
    items: [
      { id: 'entryDoor', label: 'Entry Door', type: 'options', options: [
        { id: 'standard', label: 'Timber 2040 x 920mm' },
        { id: 'oversized', label: 'Oversized 2340 x 1020mm' },
        { id: 'as_per_plan', label: 'According to the plan' },
      ]},
      { id: 'entryDoorStyle', label: 'Entry Door Style', type: 'text', placeholder: 'e.g. Hume Newington, panel, glass' },
      { id: 'internalDoors', label: 'Internal Doors', type: 'choice', standard: 'Plain Door 2040mm', upgrade: 'Deco High Doors 2340mm' },
      { id: 'doorHandles', label: 'Door Handles', type: 'choice', standard: 'Lemaar lever, chrome', upgrade: 'Matt black' },
      { id: 'frontDoorLock', label: 'Front Door Lock', type: 'choice', standard: 'Gainsborough Tri lock', upgrade: 'Smart lock / keypad' },
      { id: 'doorStoppers', label: 'Door Stoppers', type: 'choice', standard: 'Chrome look', upgrade: 'Matt black' },
      { id: 'flyscreenDoors', label: 'Flyscreen Windows', type: 'options', options: [
        { id: 'none', label: 'Not included' },
        { id: 'entries', label: 'Flyscreen to entries' },
        { id: 'operable', label: 'Operable windows only' },
      ]},
      { id: 'alfrescoDoor', label: 'Alfresco Door', type: 'choice', standard: 'Sliding aluminium 2100 x 2700mm', upgrade: 'Stacker (as per plan)' },
    ]
  },
  {
    id: 'windows',
    title: 'Windows & Glazing',
    icon: 'window',
    items: [
      { id: 'windowFrameColour', label: 'Window Frame Colour', type: 'text', placeholder: 'e.g. Monument, black, white' },
      { id: 'frontWindows', label: 'Front Windows', type: 'options', options: [
        { id: 'awning', label: 'Awning' },
        { id: 'sliding', label: 'Sliding' },
      ]},
      { id: 'sideRearWindows', label: 'Side/Rear Windows', type: 'options', options: [
        { id: 'awning', label: 'Awning' },
        { id: 'sliding', label: 'Sliding' },
      ]},
      { id: 'windowGlaze', label: 'Window Glaze', type: 'options', options: [
        { id: 'single', label: 'Single glaze' },
        { id: 'double', label: 'Double glazed' },
        { id: 'energy_report', label: 'As per energy report' },
      ]},
      { id: 'windowFurnishings', label: 'Window Furnishings', type: 'choice', standard: 'Not included', upgrade: 'Blinds (builder range)', standardLabel: 'No', upgradeLabel: 'Yes', hasWriteIn: true, writeInLabel: 'Type / details' },
    ]
  },
  {
    id: 'kitchen',
    title: 'Kitchen',
    icon: 'kitchen',
    items: [
      { id: 'benchtop', label: 'Benchtop Material', type: 'options', options: [
        { id: 'standard', label: '40mm Caesarstone polished edge' },
        { id: 'upgrade', label: 'Upgrade stone' },
        { id: 'as_per_plan', label: 'As per plan' },
      ], hasWriteIn: true, writeInFor: ['upgrade'], writeInLabel: 'Specify stone type, brand, or details...' },
      { id: 'benchtopColour', label: 'Benchtop Colour', type: 'text', placeholder: 'Enter colour' },
      { id: 'islandBench', label: 'Island Bench', type: 'choice', standard: 'No waterfall', upgrade: 'Waterfall edge', standardLabel: 'No', upgradeLabel: 'Yes' },
      { id: 'cabinetry', label: 'Cabinetry', type: 'choice', standard: 'Category 1 builder range', upgrade: 'Custom upgrade cabinets' },
      { id: 'cabinetColour', label: 'Cabinet Colour', type: 'text', placeholder: 'Enter colour' },
      { id: 'overheadCabinets', label: 'Overhead Cabinets', type: 'choice', standard: 'Above cabinet up to 2450', upgrade: 'Extended / to ceiling' },
      { id: 'handles', label: 'Cabinet Handles', type: 'choice', standard: 'Category 1 range', upgrade: 'Finger pull' },
      { id: 'splashback', label: 'Splashback', type: 'options', options: [
        { id: 'tiled', label: 'Heat resistant tiled' },
        { id: 'stone', label: 'Stone splashback' },
        { id: 'glass', label: 'Glass splashback' },
      ]},
      { id: 'splashbackColour', label: 'Splashback Colour', type: 'text', placeholder: 'Enter colour' },
      { id: 'sink', label: 'Kitchen Sink', type: 'choice', standard: 'Double bowl SS, single drainer', upgrade: 'Black series', hasWriteIn: true, writeInLabel: 'Finish (SS/black)' },
      { id: 'kitchenMixer', label: 'Kitchen Mixer', type: 'choice', standard: 'Chrome flick mixer', upgrade: 'Black series', hasWriteIn: true, writeInLabel: 'Finish' },
      { id: 'clientAppliances', label: 'Appliances Provided by Client', type: 'choice', standard: 'No', upgrade: 'Yes', standardLabel: 'No', upgradeLabel: 'Yes', hasWriteIn: true, writeInLabel: 'Specify appliances' },
      { id: 'oven', label: 'Oven', type: 'choice', standard: 'Builder range 900mm oven or similar', upgrade: 'Upgrade oven', hasWriteIn: true, writeInLabel: 'Brand/model' },
      { id: 'cooktop', label: 'Cooktop', type: 'choice', standard: 'Stainless steel', upgrade: 'Black' },
      { id: 'rangehood', label: 'Rangehood', type: 'choice', standard: 'Builder range 900mm canopy or similar', upgrade: 'Undermount / vent to roof', hasWriteIn: true, writeInLabel: 'Type' },
      { id: 'dishwasher', label: 'Dishwasher', type: 'choice', standard: 'Builder range dishwasher or similar', upgrade: 'Upgrade dishwasher', hasWriteIn: true, writeInLabel: 'Brand/model' },
      { id: 'microwave', label: 'Microwave Space', type: 'choice', standard: 'Space under benchtop', upgrade: 'Oven tower with microwave' },
      { id: 'potDrawers', label: 'Pot Drawers', type: 'choice', standard: 'Not included', upgrade: 'Pot drawers to base', standardLabel: 'No' },
      { id: 'pantryShelf', label: 'Pantry Shelving', type: 'choice', standard: 'L-shaped melamine in WIP', upgrade: 'Custom pantry fit-out' },
    ]
  },
  {
    id: 'ensuite',
    title: 'Ensuite',
    icon: 'bath',
    items: [
      { id: 'showerSize', label: 'Shower Size', type: 'choice', standard: '1200 x 900mm', upgrade: 'Custom size', hasWriteIn: true, writeInLabel: 'Size' },
      { id: 'showerScreen', label: 'Shower Screen', type: 'options', options: [
        { id: 'semi_framed', label: 'Semi framed, chrome' },
        { id: 'frameless', label: 'Frameless' },
        { id: 'black_frame', label: 'Black frame' },
      ]},
      { id: 'showerHead', label: 'Shower Head', type: 'choice', standard: 'Handheld rail, chrome (Cat 1)', upgrade: 'Overhead rain shower + handset' },
      { id: 'showerMixer', label: 'Shower Mixer', type: 'choice', standard: 'Chrome plate mixer', upgrade: 'Matt black' },
      { id: 'vanity', label: 'Vanity Type', type: 'choice', standard: 'As per plan', upgrade: 'Wall Hung' },
      { id: 'vanityTop', label: 'Vanity Top', type: 'choice', standard: '20mm Caesarstone up to 1600mm', upgrade: 'Upgraded stone', hasWriteIn: true, writeInLabel: 'Specify stone' },
      { id: 'basinType', label: 'Basin', type: 'choice', standard: 'Ceramic basin', upgrade: 'Stone counter top' },
      { id: 'basinMixer', label: 'Basin Mixer', type: 'choice', standard: 'Chrome mixer', upgrade: 'Matt black' },
      { id: 'toilet', label: 'Toilet Suite', type: 'choice', standard: 'Soft close, full/half flush', upgrade: 'Wall-hung / back-to-wall premium' },
      { id: 'floorTiles', label: 'Floor Tiles', type: 'options', options: [
        { id: 'porcelain', label: '600 x 600mm Porcelain' },
        { id: 'nonslip', label: 'Non-Slip Tiles' },
        { id: 'premium', label: 'Premium Tile' },
      ], hasWriteIn: true, writeInLabel: 'Specify tile' },
      { id: 'floorTileColour', label: 'Floor Tile Colour', type: 'text', placeholder: 'Enter colour' },
      { id: 'wallTiles', label: 'Wall Tiles', type: 'choice', standard: 'Porcelain tiles 600x600', upgrade: 'Floor to ceiling full bathroom' },
      { id: 'wallTileColour', label: 'Wall Tile Colour', type: 'text', placeholder: 'Enter colour' },
      { id: 'showerNiche', label: 'Shower Niche', type: 'choice', standard: 'Tiled niche 450 x 450mm', upgrade: 'Custom size', hasWriteIn: true, writeInLabel: 'Size' },
      { id: 'mirror', label: 'Mirror', type: 'choice', standard: 'Polished edge, vanity width', upgrade: 'LED backlit mirror' },
      { id: 'towelRail', label: 'Towel Rail & Accessories', type: 'choice', standard: 'Chrome finish', upgrade: 'Matt black' },
      { id: 'exhaust', label: 'Exhaust Fan', type: 'choice', standard: '250mm exhaust fan', upgrade: 'Premium / larger size' },
    ]
  },
  {
    id: 'bathroom',
    title: 'Bathroom',
    icon: 'bath',
    items: [
      { id: 'showerSize', label: 'Shower Size', type: 'choice', standard: 'As per plan', upgrade: 'Custom size', hasWriteIn: true, writeInLabel: 'Size' },
      { id: 'showerScreen', label: 'Shower Screen', type: 'options', options: [
        { id: 'semi_framed', label: 'Semi framed, chrome' },
        { id: 'frameless', label: 'Frameless' },
        { id: 'black_frame', label: 'Black frame' },
      ]},
      { id: 'showerHead', label: 'Shower Head', type: 'choice', standard: 'Handheld rail, chrome (Cat 1)', upgrade: 'Overhead rain shower + handset' },
      { id: 'bathtub', label: 'Bathtub', type: 'choice', standard: 'Category 1 inset bathtub', upgrade: 'Freestanding bathtub' },
      { id: 'bathMixer', label: 'Bath Mixer & Spout', type: 'choice', standard: 'Chrome plate mixer + spout', upgrade: 'Matt black' },
      { id: 'vanity', label: 'Vanity', type: 'choice', standard: 'As per plan', upgrade: 'Wall Hung' },
      { id: 'basinMixer', label: 'Basin Mixer', type: 'choice', standard: 'Chrome mixer', upgrade: 'Matt black' },
      { id: 'toilet', label: 'Toilet Suite', type: 'choice', standard: 'Soft close, full/half flush', upgrade: 'Wall-hung / back-to-wall' },
      { id: 'floorTiles', label: 'Floor/Wall Tiles', type: 'options', options: [
        { id: 'porcelain', label: 'Porcelain' },
        { id: 'nonslip', label: 'Non-Slip Tiles' },
        { id: 'upgraded', label: 'Upgraded Tiles' },
      ], hasWriteIn: true, writeInLabel: 'Specify tile' },
      { id: 'tapwareFinish', label: 'Overall Tapware Finish', type: 'choice', standard: 'Chrome throughout', upgrade: 'Matt black' },
      { id: 'towelRail', label: 'Towel Rail & Accessories', type: 'choice', standard: 'Chrome finish', upgrade: 'Matt black' },
      { id: 'ndisAccessibility', label: 'NDIS Accessibility', type: 'choice', standard: 'Not included', upgrade: 'NDIS compliant', standardLabel: 'No', upgradeLabel: 'Yes', hasWriteIn: true, writeInLabel: 'Specify requirements' },
      { id: 'grabRails', label: 'Grab Rails', type: 'options', dependsOn: { field: 'ndisAccessibility', value: 'upg' }, options: [
        { id: 'shower', label: 'Shower grab rails' },
        { id: 'toilet', label: 'Toilet grab rails' },
        { id: 'bath', label: 'Bathtub grab rails' },
        { id: 'all', label: 'All areas' },
      ], hasWriteIn: true, writeInLabel: 'Additional details' },
      { id: 'showerSeat', label: 'Shower Seat', type: 'choice', standard: 'Not included', upgrade: 'Fold-down shower seat', standardLabel: 'No', upgradeLabel: 'Yes', dependsOn: { field: 'ndisAccessibility', value: 'upg' } },
      { id: 'hoblessShower', label: 'Hobless / Step-Free Shower', type: 'choice', standard: 'Not included', upgrade: 'Hobless entry', standardLabel: 'No', upgradeLabel: 'Yes', dependsOn: { field: 'ndisAccessibility', value: 'upg' } },
      { id: 'multipleBathrooms', label: 'Multiple Bathrooms', type: 'choice', standard: 'No', upgrade: 'Same as above', standardLabel: 'No', upgradeLabel: 'Yes' },
    ]
  },
  {
    id: 'powder',
    title: 'Powder Room',
    icon: 'bath',
    items: [
      { id: 'powderRoomIncluded', label: 'Powder Room Applicable?', type: 'choice', standard: 'No', upgrade: 'Yes', standardLabel: 'No - Skip', upgradeLabel: 'Yes' },
      { id: 'included', label: 'Powder Room', type: 'choice', standard: 'As per plan', upgrade: 'Upgraded fixtures', dependsOn: { field: 'powderRoomIncluded', value: 'upg' } },
      { id: 'vanity', label: 'Vanity', type: 'choice', standard: 'Compact vanity with stone top', upgrade: 'Premium / wall-hung', dependsOn: { field: 'powderRoomIncluded', value: 'upg' } },
      { id: 'basinMixer', label: 'Basin Mixer', type: 'choice', standard: 'Chrome mixer', upgrade: 'Matt black', dependsOn: { field: 'powderRoomIncluded', value: 'upg' } },
      { id: 'toilet', label: 'Toilet Suite', type: 'choice', standard: 'Soft close, full/half flush', upgrade: 'Wall-hung / premium', dependsOn: { field: 'powderRoomIncluded', value: 'upg' } },
      { id: 'mirror', label: 'Mirror', type: 'choice', standard: 'Polished edge mirror', upgrade: 'LED backlit mirror', dependsOn: { field: 'powderRoomIncluded', value: 'upg' } },
      { id: 'wallCeilingTiles', label: 'Floor to Wall/Ceiling Tiles', type: 'text', placeholder: 'Enter tile details', dependsOn: { field: 'powderRoomIncluded', value: 'upg' } },
      { id: 'wallCeilingTilesNotes', label: 'Floor to Wall/Ceiling Tiles - Notes', type: 'text', placeholder: 'Add notes...', dependsOn: { field: 'powderRoomIncluded', value: 'upg' } },
      { id: 'floorTilesPowder', label: 'Floor Tiles', type: 'text', placeholder: 'Enter tile details', dependsOn: { field: 'powderRoomIncluded', value: 'upg' } },
      { id: 'floorTilesPowderNotes', label: 'Floor Tiles - Notes', type: 'text', placeholder: 'Add notes...', dependsOn: { field: 'powderRoomIncluded', value: 'upg' } },
    ]
  },
  {
    id: 'laundry',
    title: 'Laundry',
    icon: 'laundry',
    items: [
      { id: 'benchtop', label: 'Benchtop', type: 'choice', standard: '20mm Caesarstone', upgrade: 'Upgrade stone', hasWriteIn: true, writeInLabel: 'Specify stone type, brand, or details...' },
      { id: 'cabinetry', label: 'Cabinetry', type: 'choice', standard: 'Bottom cabinetry', upgrade: 'Full cabinetry + overhead' },
      { id: 'trough', label: 'Laundry Trough', type: 'choice', standard: '45L inset trough with mixer', upgrade: 'Undermount sink' },
      { id: 'troughMixer', label: 'Trough Mixer', type: 'choice', standard: 'Chrome flick mixer', upgrade: 'Matt black mixer' },
      { id: 'splashback', label: 'Splashback', type: 'choice', standard: 'Tiled', upgrade: 'Full height tiles' },
      { id: 'linenCupboard', label: 'Linen/Broom Cupboard', type: 'options', options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
        { id: 'asPerPlan', label: 'As per plan' },
      ]},
    ]
  },
  {
    id: 'robes',
    title: 'Robes & Linen',
    icon: 'closet',
    items: [
      { id: 'robeDoors', label: 'Robe Doors', type: 'choice', standard: 'Sliding robe doors', upgrade: 'Mirror sliding doors' },
      { id: 'robeDoorFrame', label: 'Robe Door Frame', type: 'choice', standard: 'Standard frame', upgrade: 'Black frame / vinyl' },
      { id: 'robeHeight', label: 'Robe Height', type: 'choice', standard: '2040 x 920mm doors', upgrade: 'High robes 2340/2400mm' },
      { id: 'bedroomShelving', label: 'Bedroom Robe Shelving', type: 'choice', standard: 'Melamine shelf + 1 rail + pigeon holes', upgrade: 'Custom fit-out' },
      { id: 'masterWIR', label: 'Master WIR', type: 'choice', standard: 'Melamine + 1 rail + 2 pigeon holes', upgrade: 'Custom walk-in fit-out' },
      { id: 'linenShelving', label: 'Linen Cupboard', type: 'choice', standard: '4 white melamine shelves', upgrade: 'Additional shelving' },
    ]
  },
  {
    id: 'paint',
    title: 'Paintwork',
    icon: 'paint',
    items: [
      { id: 'wallPaint', label: 'Internal Walls', type: 'choice', standard: 'Washable acrylic, 3 coat', upgrade: 'Premium washable paint' },
      { id: 'wallColour', label: 'Wall Colour', type: 'text', placeholder: 'Enter colour code/name' },
      { id: 'ceilingPaint', label: 'Ceiling', type: 'choice', standard: 'Flat acrylic, 2 coat', upgrade: '3 coat premium ceiling paint' },
      { id: 'ceilingColour', label: 'Ceiling Colour', type: 'text', placeholder: 'e.g. White, ceiling white' },
      { id: 'doorsWoodwork', label: 'Doors & Woodwork', type: 'choice', standard: 'Gloss enamel', upgrade: 'Semi-gloss / satin' },
      { id: 'featureWall', label: 'Feature Wall', type: 'choice', standard: '1 feature wall any room', upgrade: 'Additional feature walls' },
      { id: 'featureColour', label: 'Feature Wall Colour', type: 'text', placeholder: 'Enter colour' },
      { id: 'entryDoorFinish', label: 'Entry Door Finish', type: 'choice', standard: 'Timber stain finish', upgrade: 'Custom stain / painted', hasWriteIn: true, writeInLabel: 'Specify colour/stain' },
      { id: 'externalPaint', label: 'External Paint', type: 'choice', standard: 'Low sheen acrylic', upgrade: 'Solar guard / premium' },
    ]
  },
  {
    id: 'flooring',
    title: 'Floor Covering',
    icon: 'floor',
    items: [
      { id: 'mainFloor', label: 'Living / Main Areas', type: 'options', options: [
        { id: 'laminate', label: 'Laminate' },
        { id: 'hybrid', label: 'Hybrid' },
        { id: 'tiles', label: 'Tiles' },
      ]},
      { id: 'bedrooms', label: 'Bedrooms', type: 'choice', standard: "Carpet from builder's range", upgrade: 'Hybrid throughout', hasWriteIn: true, writeInLabel: 'Specify type, brand, or details...' },
      { id: 'staircase', label: 'Staircase Flooring (if double storey)', type: 'choice', standard: 'Carpet to stairs', upgrade: 'Hybrid to stair treads & risers' },
    ]
  },
  {
    id: 'internal',
    title: 'Internal Features',
    icon: 'home',
    items: [
      { id: 'ceilingHeight', label: 'Ground Floor Ceiling Height', type: 'choice', standard: '2700mm', upgrade: '3 meters or 3.6', hasWriteIn: true, writeInLabel: 'Notes' },
      { id: 'cornice', label: 'Cornice', type: 'choice', standard: '75mm plaster cornice', upgrade: 'Square set', hasWriteIn: true, writeInLabel: 'Notes' },
      { id: 'skirtingArchitrave', label: 'Skirting & Architraves', type: 'choice', standard: '67x18 MDF', upgrade: "92x18mm from builder's range", hasWriteIn: true, writeInLabel: 'Specify size, profile, or details...' },
      { id: 'bulkhead', label: 'Bulkhead', type: 'options', options: [
        { id: 'island', label: 'Island or entrance bulkhead' },
        { id: 'additional', label: 'Additional bulkheads' },
        { id: 'as_per_plan', label: 'As per plan bulkheads' },
      ]},
      { id: 'cladding', label: 'Cladding', type: 'text', placeholder: 'Specify cladding type' },
      { id: 'featureWall', label: 'Feature Wall', type: 'options', options: [
        { id: 'included', label: 'Included' },
        { id: 'not_included', label: 'Not included' },
        { id: 'as_per_plan', label: 'As per plan' },
      ]},
      { id: 'staircase', label: 'Staircase', type: 'choice', standard: "MDF Stairs from builder's range", upgrade: 'Custom staircase', hasWriteIn: true, writeInLabel: 'Add notes about staircase...' },
      { id: 'balustrade', label: 'Balustrade', type: 'options', hasWriteIn: true, writeInLabel: 'Add notes about balustrade...', options: [
        { id: 'glass', label: 'Glass' },
        { id: 'metal', label: 'Metal' },
        { id: 'custom', label: 'Custom' },
      ]},
    ]
  },
  {
    id: 'heating',
    title: 'Heating & Cooling',
    icon: 'thermometer',
    items: [
      { id: 'cooling', label: 'Cooling System', type: 'options', options: [
        { id: 'builder_range', label: 'Builder range' },
        { id: 'split', label: 'Split system' },
        { id: 'reverse_cycle', label: 'Reverse cycle system' },
      ]},
      { id: 'coolingNotes', label: 'Cooling Notes', type: 'text', placeholder: 'Zones, notes...' },
      { id: 'heating', label: 'Heating System', type: 'choice', standard: 'Standard (Round) Vents', upgrade: 'Linear Vents' },
      { id: 'hotWater', label: 'Hot Water System', type: 'choice', standard: '26L gas continuous flow', upgrade: 'Heat pump / solar', hasWriteIn: true, writeInLabel: 'Type/brand' },
    ]
  },
  {
    id: 'electrical',
    title: 'Electricals',
    icon: 'zap',
    items: [
      { id: 'downLights', label: 'Down Lights', type: 'choice', standard: '20 LED', upgrade: 'As per plan' },
      { id: 'switchPlates', label: 'Switch Plates', type: 'choice', standard: 'Builder range white plates', upgrade: 'Iconic black or white' },
      { id: 'powerPoints', label: 'Power Points', type: 'choice', standard: '1 double GPO per room, 2 in master', upgrade: 'As per plan', hasWriteIn: true, writeInLabel: 'Details' },
      { id: 'pendantLights', label: 'Pendant/Drop Lights', type: 'choice', standard: '3 drop light + 2 pillar points', upgrade: 'As per plan' },
      { id: 'fans', label: 'Fan', type: 'choice', standard: 'Not included', upgrade: 'Yes', standardLabel: 'No', upgradeLabel: 'Yes', hasWriteIn: true, writeInLabel: 'How many fans and where' },
      { id: 'chandelier', label: 'Chandelier', type: 'choice', standard: 'Not included', upgrade: 'Yes', standardLabel: 'No', upgradeLabel: 'Yes', hasWriteIn: true, writeInLabel: 'Details' },
      { id: 'intercom', label: 'Video Intercom', type: 'choice', standard: 'Panacom or similar', upgrade: 'Premium brand', hasWriteIn: true, writeInLabel: 'Brand' },
      { id: 'alarm', label: 'Alarm System', type: 'choice', standard: 'Bosch, 3 sensors', upgrade: 'Extra sensors / smart alarm', hasWriteIn: true, writeInLabel: 'Qty extra sensors' },
      { id: 'tvPoints', label: 'TV & Data Points', type: 'choice', standard: '2 TV + 2 telephone + 2 data', upgrade: 'Additional points', hasWriteIn: true, writeInLabel: 'Qty extra' },
      { id: 'smokeDetectors', label: 'Smoke Detectors', type: 'choice', standard: 'Hardwired with battery backup', upgrade: 'Interconnected / smart' },
      { id: 'externalLights', label: 'External Lights', type: 'choice', standard: '1 front sensor + 1 rear flood', upgrade: 'Additional external lighting', hasWriteIn: true, writeInLabel: 'Details' },
      { id: 'externalGPO', label: 'External Power Points', type: 'choice', standard: '1 external double GPO', upgrade: 'Additional external GPOs', hasWriteIn: true, writeInLabel: 'Qty' },
    ]
  },
  {
    id: 'external',
    title: 'Driveway & External',
    icon: 'truck',
    items: [
      { id: 'driveway', label: 'Driveway', type: 'choice', standard: 'Not included', upgrade: 'Colour concrete as per plan', standardLabel: 'No', hasWriteIn: true, writeInLabel: 'Type & colour' },
      { id: 'drivewaySize', label: 'Driveway Size (if selected)', type: 'text', placeholder: 'e.g. Up to 27.5 SQM' },
      { id: 'concrete', label: 'Concrete Around House', type: 'options', options: [
        { id: 'plain', label: 'Plain concrete' },
        { id: 'colored', label: 'Colored concrete' },
      ], hasWriteIn: true, writeInLabel: 'Specify details, colour, or area...' },
      { id: 'porchFloorFinish', label: 'Porch Floor Finish', type: 'text', placeholder: 'e.g. Colour concrete, tiled' },
      { id: 'pergola', label: 'Pergola', type: 'choice', standard: 'Not included', upgrade: 'Included', standardLabel: 'No', upgradeLabel: 'Yes', hasWriteIn: true, writeInLabel: 'Notes' },
      { id: 'veranda', label: 'Veranda', type: 'choice', standard: 'Not included', upgrade: 'Included', standardLabel: 'No', upgradeLabel: 'Yes', hasWriteIn: true, writeInLabel: 'Notes' },
      { id: 'footpath', label: 'Footpath', type: 'choice', standard: 'Not included', upgrade: 'As per plan', standardLabel: 'No' },
      { id: 'crossover', label: 'Crossover', type: 'choice', standard: 'As per plan', upgrade: 'Client will pay' },
      { id: 'retainingWall', label: 'Retaining Wall', type: 'choice', standard: 'Not included', upgrade: 'As per plan', standardLabel: 'No', hasWriteIn: true, writeInLabel: 'Notes' },
      { id: 'gardenTaps', label: 'Garden Taps', type: 'choice', standard: '1 front + 1 rear', upgrade: 'Additional taps' },
      { id: 'clothesline', label: 'Clothesline', type: 'choice', standard: 'Not included', upgrade: "Builder's range", standardLabel: 'No' },
      { id: 'letterbox', label: 'Letterbox', type: 'choice', standard: 'Not included', upgrade: "Builder's range", standardLabel: 'No' },
      { id: 'meterBox', label: 'Meter Box', type: 'choice', standard: 'Standard meter box', upgrade: 'Brick meter box' },
    ]
  },
  {
    id: 'landscape',
    title: 'Landscaping & Fencing',
    icon: 'tree',
    items: [
      { id: 'landscaping', label: 'Landscaping', type: 'options', options: [
        { id: 'not_included', label: 'Not included' },
        { id: 'builders', label: "Builder's standard landscaping" },
        { id: 'as_per_plan', label: 'As per plan' },
      ]},
      { id: 'frontFence', label: 'Front Fence', type: 'choice', standard: 'Not included', upgrade: 'Front fence as per plan', standardLabel: 'No', hasWriteIn: true, writeInLabel: 'Style' },
      { id: 'sideFence', label: 'Side/Rear Fencing', type: 'choice', standard: 'Not included (owner responsibility)', upgrade: '1.8m timber paling fence', hasWriteIn: true, writeInLabel: 'Notes' },
      { id: 'veggieBed', label: 'Veggie Bed', type: 'choice', standard: 'No', upgrade: 'Yes', standardLabel: 'No', upgradeLabel: 'Yes', hasWriteIn: true, writeInLabel: 'Notes' },
      { id: 'turf', label: 'Turf / Lawn', type: 'choice', standard: 'Not included', upgrade: 'Turf to front & rear', standardLabel: 'No' },
      { id: 'gardenShed', label: 'Garden Shed', type: 'choice', standard: 'As per plan', upgrade: "From builder's range when necessary" },
      { id: 'irrigation', label: 'Watering/Irrigation System', type: 'choice', standard: 'Not included', upgrade: 'As per plan', standardLabel: 'No' },
      { id: 'rainwaterTank', label: 'Rainwater Tank', type: 'choice', standard: 'As per developer requirements', upgrade: 'Upgraded size', hasWriteIn: true, writeInLabel: 'Size (L)' },
    ]
  },
  {
    id: 'sustainability',
    title: 'Sustainability & Energy',
    icon: 'leaf',
    items: [
      { id: 'energyRating', label: 'Energy Rating', type: 'choice', standard: '6 Star', upgrade: 'As per energy report' },
      { id: 'solarSystem', label: 'Solar System', type: 'choice', standard: 'No', upgrade: 'According to developer approval/energy report', standardLabel: 'No', upgradeLabel: 'Yes' },
      { id: 'evChargePoint', label: 'EV Charge Point', type: 'choice', standard: 'Not included', upgrade: 'EV ready GPO in garage (32 Amp)', standardLabel: 'No' },
      { id: 'wallInsulation', label: 'Wall Insulation', type: 'choice', standard: 'R2.0 thermal insulation', upgrade: 'As per energy report' },
      { id: 'ceilingInsulation', label: 'Ceiling Insulation', type: 'choice', standard: 'R3.5 thermal insulation', upgrade: 'As per energy report' },
    ]
  },
  {
    id: 'pricing',
    title: 'Pricing',
    icon: 'dollar',
    items: [
      { id: 'dwellingTwoEnabled', label: 'Dual Dwelling Pricing', type: 'choice', standard: 'Single dwelling', upgrade: 'Dual dwelling', standardLabel: 'No', upgradeLabel: 'Yes' },
      { id: 'dwellingOneLandSize', label: 'Dwelling One Land Size (m\u00B2)', type: 'text', placeholder: 'e.g. 300' },
      { id: 'dwellingOnePrice', label: 'Dwelling One Price ($)', type: 'currency', placeholder: 'e.g. 350000' },
      { id: 'dwellingTwoLandSize', label: 'Dwelling Two Land Size (m\u00B2)', type: 'text', placeholder: 'e.g. 250', dependsOn: { field: 'dwellingTwoEnabled', value: 'upg' } },
      { id: 'dwellingTwoPrice', label: 'Dwelling Two Price ($)', type: 'currency', placeholder: 'e.g. 320000', dependsOn: { field: 'dwellingTwoEnabled', value: 'upg' } },
      { id: 'siteWorksPrice', label: 'Site Works ($)', type: 'currency', placeholder: 'e.g. 25000' },
      { id: 'demolitionPrice', label: 'Demolition ($)', type: 'currency', placeholder: 'e.g. 15000' },
      { id: 'upgradesPrice', label: 'Upgrades / Extras ($)', type: 'currency', placeholder: 'e.g. 10000' },
      { id: 'otherLabel', label: 'Other Cost Description', type: 'text', placeholder: 'e.g. Landscaping, Fencing' },
      { id: 'otherPrice', label: 'Other Cost ($)', type: 'currency', placeholder: 'e.g. 5000' },
      { id: 'gstIncluded', label: 'GST', type: 'choice', standard: 'Excluding GST', upgrade: 'Including GST', standardLabel: 'Excl. GST', upgradeLabel: 'Incl. GST' },
    ]
  },
  {
    id: 'notes',
    title: 'Additional Notes',
    icon: 'note',
    items: [
      { id: 'demolition', label: 'Demolition', type: 'choice', standard: 'Not included', upgrade: 'Included', standardLabel: 'No', upgradeLabel: 'Yes', hasWriteIn: true, writeInLabel: 'Demolition details (e.g. existing structure, scope)' },
      { id: 'clientNotes', label: 'Client Notes / Special Requirements', type: 'textarea' },
      { id: 'upgradesDiscussed', label: 'Additional Upgrades Discussed', type: 'textarea' },
      { id: 'developerRequirements', label: 'Developer / Estate Specific Requirements', type: 'textarea', helperText: 'Any additional feature/change required by the developer will be raised as a variation to the client.' },
      { id: 'budgetNotes', label: 'Budget / Pricing Notes', type: 'textarea' },
    ]
  },
]
