import {
  PrismaClient,
  UserRole,
  InnovationStage,
  InnovationStatus,
  CourseDeliveryMode,
  CohortStatus,
  EventType,
  EventStatus,
  PartnerType,
} from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // 1. Clean up existing data in reverse order of dependencies
  console.log('🧹 Cleaning up existing data...')
  await prisma.sponsorship.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.innovationSubmission.deleteMany()
  await prisma.lessonProgress.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.cohort.deleteMany()
  await prisma.eventRsvp.deleteMany()
  await prisma.application.deleteMany()
  await prisma.contactInquiry.deleteMany()
  
  await prisma.innovation.deleteMany()
  await prisma.innovationCategory.deleteMany()
  await prisma.course.deleteMany()
  await prisma.event.deleteMany()
  await prisma.post.deleteMany()
  await prisma.partner.deleteMany()
  await prisma.resource.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Existing data cleared.')

  // 2. Seed Users
  console.log('👤 Seeding Users...')
  const admin = await prisma.user.create({
    data: {
      email: 'admin@jhub.africa',
      role: UserRole.ADMIN,
      isVerified: true,
      firstName: 'Admin',
      lastName: 'User',
      bio: 'System Administrator for JHUB Africa.',
      phone: '+254700000001',
      institution: 'JHUB Africa',
    },
  })

  const innovator = await prisma.user.create({
    data: {
      email: 'innovator@jhub.africa',
      role: UserRole.INNOVATOR,
      isVerified: true,
      firstName: 'Jane',
      lastName: 'Doe',
      bio: 'Passionate innovator focused on sustainable agriculture and IoT.',
      phone: '+254700000002',
      institution: 'JKUAT',
    },
  })

  const student = await prisma.user.create({
    data: {
      email: 'student@jhub.africa',
      role: UserRole.STUDENT,
      isVerified: true,
      firstName: 'Alex',
      lastName: 'Kamau',
      bio: 'Enthusiastic student developer learning full-stack web and IoT.',
      phone: '+254700000003',
      institution: 'DeKUT',
    },
  })

  const partnerUser = await prisma.user.create({
    data: {
      email: 'partner@jhub.africa',
      role: UserRole.PARTNER,
      isVerified: true,
      firstName: 'John',
      lastName: 'Safaricom',
      bio: 'CSR Manager coordinating industry collaborations.',
      phone: '+254700000004',
      institution: 'Safaricom PLC',
    },
  })

  console.log(`✅ Seeded ${4} users.`)

  // 3. Seed Innovation Categories
  console.log('🏷️ Seeding Innovation Categories...')
  const agritechCat = await prisma.innovationCategory.create({
    data: {
      name: 'Agriculture & Agritech',
      slug: 'agriculture-agritech',
      description: 'Technologies and services improving agricultural yields, farming efficiency, and food security.',
    },
  })

  const healthtechCat = await prisma.innovationCategory.create({
    data: {
      name: 'Healthcare & Biotech',
      slug: 'healthcare-biotech',
      description: 'Biomedical devices, health tracking, and telemedicine innovations.',
    },
  })

  const edtechCat = await prisma.innovationCategory.create({
    data: {
      name: 'Education & Edtech',
      slug: 'education-edtech',
      description: 'Digital classrooms, online courses, and instructional tools.',
    },
  })

  const fintechCat = await prisma.innovationCategory.create({
    data: {
      name: 'Fintech & Financial Inclusion',
      slug: 'fintech-financial-inclusion',
      description: 'Mobile banking, microfinance, and peer-to-peer transaction technologies.',
    },
  })

  console.log('✅ Seeded categories.')

  // 4. Seed Innovations
  console.log('💡 Seeding Innovations...')
  const smartFarm = await prisma.innovation.create({
    data: {
      slug: 'smartfarm-iot',
      title: 'SmartFarm IoT System',
      tagline: 'IoT soil monitoring and automated drip irrigation for smallholder farmers.',
      problem: 'Smallholder farmers experience erratic rainfall and soil nutrient depletion, leading to low crop yields.',
      solution: 'A solar-powered IoT sensor suite measuring NPK levels, moisture, and temperature, integrated with automated water pumps.',
      stage: InnovationStage.PROTOTYPE,
      status: InnovationStatus.APPROVED,
      isFeatured: true,
      sector: 'Agriculture',
      beneficiaries: 'Over 5,000 rural farmers in semi-arid lands.',
      traction: 'Deployed 15 prototypes in local greenhouses with 35% water saving recorded.',
      impactEvidence: 'Average harvest yield increased by 20% over a 3-month cycle.',
      supportRequired: 'Mentorship on mass manufacturing and seed funding for field trials.',
      ownerId: innovator.id,
      categories: {
        connect: [{ id: agritechCat.id }],
      },
      teamMembers: {
        create: [
          { name: 'Peter Mwangi', role: 'Hardware Engineer', email: 'peter@jhub.africa' },
          { name: 'Sarah Wambui', role: 'Agronomist', email: 'sarah@jhub.africa' },
        ],
      },
    },
  })

  const teleHealth = await prisma.innovation.create({
    data: {
      slug: 'telehealth-connect',
      title: 'TeleHealth Connect Portal',
      tagline: 'Bridging the rural-urban doctor gap with localized video consultancy.',
      problem: 'Rural patients travel long distances to access specialized medical consulting.',
      solution: 'Low-bandwidth, SMS-driven telemedicine portal linking patients in rural dispensaries directly to specialists.',
      stage: InnovationStage.PILOT,
      status: InnovationStatus.APPROVED,
      isFeatured: true,
      sector: 'Healthcare',
      beneficiaries: 'Rural populations without nearby secondary healthcare facilities.',
      traction: 'Piloted with 3 county health centers; facilitated 450 consultations.',
      ownerId: admin.id,
      categories: {
        connect: [{ id: healthtechCat.id }],
      },
    },
  })

  const msoma = await prisma.innovation.create({
    data: {
      slug: 'm-soma-learning',
      title: 'M-Soma Learning Hub',
      tagline: 'Interactive offline courses for primary school learners.',
      problem: 'Limited internet connectivity isolates remote schools from modern educational content.',
      solution: 'A local micro-server broadcasting educational modules over Wi-Fi without needing internet access.',
      stage: InnovationStage.SCALING,
      status: InnovationStatus.APPROVED,
      sector: 'Education',
      ownerId: innovator.id,
      categories: {
        connect: [{ id: edtechCat.id }],
      },
    },
  })

  console.log('✅ Seeded innovations.')

  // 5. Seed Partners
  console.log('🤝 Seeding Partners...')
  const safaricom = await prisma.partner.create({
    data: {
      name: 'Safaricom PLC',
      slug: 'safaricom',
      type: PartnerType.INDUSTRY,
      website: 'https://www.safaricom.co.ke',
      description: 'Leading telecommunications provider in East Africa.',
      isFeatured: true,
    },
  })

  const mastercard = await prisma.partner.create({
    data: {
      name: 'Mastercard Foundation',
      slug: 'mastercard-foundation',
      type: PartnerType.FUNDER,
      website: 'https://mastercardfdn.org',
      description: 'Fostering financial inclusion and youth education.',
      isFeatured: true,
    },
  })

  const jkuat = await prisma.partner.create({
    data: {
      name: 'Jomo Kenyatta University of Agriculture and Technology',
      slug: 'jkuat',
      type: PartnerType.ACADEMIC,
      website: 'https://www.jkuat.ac.ke',
      description: 'Premier technological research university in Kenya.',
      isFeatured: false,
    },
  })

  console.log('✅ Seeded partners.')

  // 6. Seed Sponsorships
  console.log('💰 Seeding Sponsorships...')
  await prisma.sponsorship.create({
    data: {
      partnerId: mastercard.id,
      innovationId: smartFarm.id,
      amount: 1500000,
      currency: 'KES',
      description: 'Prototype validation grant.',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    },
  })

  await prisma.sponsorship.create({
    data: {
      partnerId: safaricom.id,
      innovationId: msoma.id,
      amount: 3200000,
      currency: 'KES',
      description: 'Scale-out sponsorship for regional dispensaries and classrooms.',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-05-31'),
    },
  })

  console.log('✅ Seeded sponsorships.')

  // 7. Seed Courses, Cohorts & Lessons
  console.log('🎓 Seeding Courses, Cohorts, and Lessons...')
  const iotCourse = await prisma.course.create({
    data: {
      slug: 'intro-to-iot-embedded-systems',
      title: 'Introduction to IoT & Embedded Systems',
      description: 'Learn the fundamentals of microcontrollers, sensor networking, and building real-world automation tools.',
      category: 'Technology',
      deliveryMode: CourseDeliveryMode.HYBRID,
      durationWeeks: 8,
      prerequisites: 'Basic knowledge of Python or C is recommended.',
      isFeatured: true,
      isPublished: true,
      cohorts: {
        create: [
          {
            name: 'Cohort 1 - Hackerspace',
            status: CohortStatus.OPEN,
            startDate: new Date('2026-07-15'),
            endDate: new Date('2026-09-10'),
            maxCapacity: 30,
            zoomLink: 'https://zoom.us/j/123456789',
            location: 'JHUB Maker Space, JKUAT Main Campus',
          },
        ],
      },
      lessons: {
        create: [
          { title: 'Welcome & Microcontrollers 101', order: 1, isPublished: true },
          { title: 'ADC, DAC and basic Sensors', order: 2, isPublished: true },
          { title: 'Wi-Fi Modules & MQTT Broker setup', order: 3, isPublished: true },
        ],
      },
    },
  })

  const businessCourse = await prisma.course.create({
    data: {
      slug: 'agribusiness-innovation-management',
      title: 'Agribusiness Innovation & Management',
      description: 'An introductory program teaching agritech innovators how to scale and commercialize agricultural business models.',
      category: 'Agribusiness',
      deliveryMode: CourseDeliveryMode.ONLINE,
      durationWeeks: 4,
      isFeatured: false,
      isPublished: true,
      cohorts: {
        create: [
          {
            name: 'Cohort A - Virtual Class',
            status: CohortStatus.IN_PROGRESS,
            startDate: new Date('2026-06-01'),
            endDate: new Date('2026-06-30'),
            zoomLink: 'https://zoom.us/j/987654321',
          },
        ],
      },
      lessons: {
        create: [
          { title: 'Understanding Agrifood Supply Chains', order: 1, isPublished: true },
          { title: 'Value Additions and Farm economics', order: 2, isPublished: true },
        ],
      },
    },
  })

  console.log('✅ Seeded educational database.')

  // 8. Seed Events
  console.log('📅 Seeding Events...')
  await prisma.event.create({
    data: {
      slug: 'jhub-annual-hackathon-2026',
      title: 'JHUB Africa Annual Hackathon 2026',
      description: 'A 48-hour intensive building challenge focusing on climate change and community resilience solutions.',
      type: EventType.HACKATHON,
      status: EventStatus.PUBLISHED,
      isFeatured: true,
      startDate: new Date('2026-10-10T08:00:00Z'),
      endDate: new Date('2026-10-12T17:00:00Z'),
      location: 'JKUAT Assembly Hall & Maker Space',
      isOnline: false,
      maxCapacity: 120,
      registrationDeadline: new Date('2026-10-01T23:59:59Z'),
    },
  })

  await prisma.event.create({
    data: {
      slug: 'iot-in-agriculture-workshop',
      title: 'IoT in Agriculture Hands-On Workshop',
      description: 'Learn to hook up NPK and moisture sensors to ESP32 microcontrollers and broadcast data using MQTT.',
      type: EventType.WORKSHOP,
      status: EventStatus.PUBLISHED,
      isFeatured: false,
      startDate: new Date('2026-07-20T09:00:00Z'),
      endDate: new Date('2026-07-20T16:00:00Z'),
      location: 'JHUB Lab Room 4',
      isOnline: true,
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      maxCapacity: 50,
      registrationDeadline: new Date('2026-07-18T23:59:59Z'),
    },
  })

  console.log('✅ Seeded events.')

  // 9. Seed Posts (News & Stories)
  console.log('📰 Seeding Posts...')
  await prisma.post.create({
    data: {
      slug: 'mastercard-foundation-partnership',
      title: 'JHUB Africa Partners with Mastercard Foundation to Drive Digital Literacy',
      excerpt: 'Through a multi-year partnership, the foundation will support students learning digital design and software development.',
      content: 'JHUB Africa is proud to announce a new partnership with the Mastercard Foundation. Under this collaboration, we will deliver state-of-the-art laboratory facilities, technical mentorship programs, and full scholarships to rural innovation leaders, helping build digital capacity and community resilience.',
      category: 'announcement',
      isPublished: true,
      isFeatured: true,
      publishedAt: new Date('2026-06-15'),
      tags: ['partnership', 'mastercard', 'literacy'],
    },
  })

  await prisma.post.create({
    data: {
      slug: 'smartfarm-wins-innovation-award',
      title: 'SmartFarm IoT System Bags Top Award at Agritech Summit',
      excerpt: 'Developed right in the JHUB Maker space, SmartFarm IoT took home the Innovative Sensor Application award.',
      content: 'We celebrate Jane Doe, a JHUB innovator whose project, the SmartFarm IoT Soil Monitor, clinched the first prize at the National Agritech Innovation Summit. The system impressed judges with its low energy usage, localized NPK analytics, and automated watering triggers.',
      category: 'project-update',
      isPublished: true,
      isFeatured: false,
      publishedAt: new Date('2026-06-28'),
      tags: ['award', 'agritech', 'iot'],
    },
  })

  console.log('✅ Seeded posts.')

  // 10. Seed Resources
  console.log('📚 Seeding Resources...')
  await prisma.resource.create({
    data: {
      slug: 'agritech-startup-toolkit',
      title: 'Agritech Startup Toolkit: Ideation to Market Fit',
      description: 'A comprehensive starter kit outlining farming distribution channels, regulatory guidelines in Kenya, and agronomy contacts.',
      category: 'toolkit',
      fileUrl: 'https://jhub.africa/downloads/agritech-toolkit.pdf',
      isPublished: true,
      downloadCount: 142,
    },
  })

  await prisma.resource.create({
    data: {
      slug: 'jhub-branding-assets',
      title: 'JHUB Africa Logo Packs and Brand Identity Guidelines',
      description: 'Official typography rules, primary HSL values, SVG templates, and logo packs.',
      category: 'brief',
      fileUrl: 'https://jhub.africa/downloads/jhub-brand-pack.zip',
      isPublished: true,
      downloadCount: 56,
    },
  })

  console.log('✅ Seeded resources.')
  console.log('🎉 Seeding successfully completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error while seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
