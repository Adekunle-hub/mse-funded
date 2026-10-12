export type AccentTone = "mint" | "cream" | "pink"

export const verificationCallouts = [
  { title: "Checked deadline", description: "With days left, in words" },
  { title: "Official source", description: "The real funder, named" },
  { title: "Date we last checked", description: "On every listing" },
]

export const steps: { title: string; description: string; tone: AccentTone }[] = [
  {
    title: "Search by your field",
    description: "Filter by level, country and field, from polymers to corrosion.",
    tone: "mint",
  },
  {
    title: "Check the facts",
    description: "Each listing shows the official link, the deadline and who can apply.",
    tone: "cream",
  },
  {
    title: "Save and track",
    description:
      "Save what fits, track your applications and get deadline reminders on WhatsApp.",
    tone: "pink",
  },
]

export const fieldGuide = [
  {
    name: "Polymers",
    title: "Polymers",
    description: "Long-chain molecules behind plastics, membranes, fibres and biomaterials.",
  },
  {
    name: "Ceramics",
    title: "Ceramics",
    description: "Hard, heat-resistant oxides and carbides for turbines, electronics and implants.",
  },
  {
    name: "Metals",
    title: "Metals and metallurgy",
    description: "Alloys and steels, from casting and heat treatment to metal 3D printing.",
  },
  {
    name: "Nanomaterials",
    title: "Nanomaterials",
    description: "Particles, tubes and sheets a few nanometres across, such as graphene.",
  },
  {
    name: "Composites",
    title: "Composites",
    description: "Fibres held in a matrix, like the carbon-fibre laminates in aircraft and wind blades.",
  },
  {
    name: "Corrosion",
    title: "Corrosion",
    description: "How metals degrade in service, and the coatings and alloys that slow it down.",
  },
  {
    name: "Manufacturing",
    title: "Manufacturing",
    description: "Turning materials into parts, from 3D printing and welding to machining and forming.",
  },
  {
    name: "Sustainable energy",
    title: "Sustainable energy",
    description: "Materials for solar cells, batteries, hydrogen and fuel cells, and cleaner industry.",
  },
]

export type TetrahedronNode = "processing" | "structure" | "properties" | "performance" | "characterisation"

export const tetrahedron: Record<TetrahedronNode, { title: string; summary: string; topics: string[] }> = {
  processing: {
    title: "Processing",
    summary: "How a material is made and shaped: casting, sintering, extrusion, heat treatment and 3D printing.",
    topics: ["Additive manufacturing of alloys", "Sintering of advanced ceramics", "Polymer recycling and extrusion"],
  },
  structure: {
    title: "Structure",
    summary: "How atoms, grains and phases are arranged, from the crystal lattice to the microstructure under a microscope.",
    topics: ["Grain growth and texture", "Phase transformations in steels", "Defects in 2D materials"],
  },
  properties: {
    title: "Properties",
    summary: "How the material behaves: strength, toughness, conductivity, and resistance to heat and corrosion.",
    topics: ["Fatigue and fracture", "Thermal and electrical conductivity", "Corrosion resistance of coatings"],
  },
  performance: {
    title: "Performance",
    summary: "How it serves in real use, over years: a turbine blade, a hip implant, a battery electrode.",
    topics: ["Creep in turbine blades", "Battery electrode lifetime", "Biocompatibility of implants"],
  },
  characterisation: {
    title: "Characterisation",
    summary: "The tools that connect the four corners, showing what is really inside a material and how it responds.",
    topics: ["Electron microscopy (SEM, TEM)", "X-ray diffraction", "Mechanical and electrochemical testing"],
  },
}

export const faqs = [
  {
    question: "Is MseFunded free?",
    answer: "Yes. Searching, saving scholarships and deadline reminders are free for students.",
  },
  {
    question: "Can international students, including Nigerians, apply?",
    answer:
      "Many listings are open to international applicants. Each listing shows who can apply under “Open to”, copied from the official page.",
  },
  {
    question: "Do I need a master’s degree to apply for a PhD?",
    answer:
      "Not always. Many UK PhDs accept a strong bachelor’s degree, while much of mainland Europe expects a master’s. Check “Who can apply” on each listing.",
  },
  {
    question: "What does “fully funded” mean here?",
    answer:
      "Tuition is covered and there is a living allowance, either a stipend or a salary. Awards that cover only part of this are labelled tuition only, stipend only or partial.",
  },
  {
    question: "How do you check a listing?",
    answer:
      "We find funded places on founders’ and universities’ own pages. We read each page and take the deadline, funding and eligibility from it, open the official link before the listing goes live, and show the date we checked. Listings with unclear details are marked “Under review”. Always confirm on the official page before you apply.",
  },
  {
    question: "Which fields do you cover?",
    answer:
      "Materials science and engineering: polymers, ceramics, metals, nanomaterials, composites and corrosion, including related metallurgical and chemical engineering projects.",
  },
]
