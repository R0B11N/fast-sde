const fs = require('fs')

async function runTests() {
    const BASE_URL = 'http://localhost:3000'
    let accessToken = ''
    let refreshToken = ''
    let documentId = ''

    console.log('--- Frank Cusimano API Verification ---')

    // 1. Health check
    console.log('\n1. Health Check')
    let res = await fetch(`${BASE_URL}/health`)
    let data = await res.json()
    console.log(`Status: ${res.status}`, data)

    // 2. Register
    console.log('\n2. Register')
    res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'robin@maxim.com', password: 'Test1234!', firstName: 'Robin', lastName: 'Gershman' })
    })
    data = await res.json()
    console.log(`Status: ${res.status}`, data)

    // 3. Login
    console.log('\n3. Login')
    res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'robin@maxim.com', password: 'Test1234!' })
    })
    data = await res.json()
    console.log(`Status: ${res.status}`, data)
    accessToken = data.accessToken
    refreshToken = data.refreshToken

    // 4. Me
    console.log('\n4. Get Me')
    res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    data = await res.json()
    console.log(`Status: ${res.status}`, data)

    // Create dummy PDF for testing
    fs.writeFileSync('test_document.pdf', 'dummy pdf content')

    // 5. Upload Document
    console.log('\n5. Upload Document')
    const formData = new FormData()
    const fileBlob = new Blob([fs.readFileSync('test_document.pdf')], { type: 'application/pdf' })
    formData.append('file', fileBlob, 'test_document.pdf')
    formData.append('docType', 'site_plan')

    res = await fetch(`${BASE_URL}/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData
    })
    data = await res.json()
    console.log(`Status: ${res.status}`, data)
    documentId = data.id

    // 6. List Documents
    console.log('\n6. List Documents')
    res = await fetch(`${BASE_URL}/documents`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    data = await res.json()
    console.log(`Status: ${res.status}`, data)

    // 7. Get Document by ID
    console.log('\n7. Get Document by ID')
    res = await fetch(`${BASE_URL}/documents/${documentId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    data = await res.json()
    console.log(`Status: ${res.status}`, data)

    // 8. Refresh Token
    console.log('\n8. Refresh Token')
    res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
    })
    data = await res.json()
    console.log(`Status: ${res.status}`, data)

    // Clean up
    fs.unlinkSync('test_document.pdf')
}

runTests().catch(console.error)
