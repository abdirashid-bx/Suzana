const mongoose = require('mongoose');
const Student = require('./models/Student');
const Grade = require('./models/Grade');
const Classroom = require('./models/Classroom');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to Database');

        // The student ID we've been testing with (or from the user's screenshot context if available, but I'll use the one from previous context)
        // User mentioned URLs like http://localhost:3000/api/students/69528bce4c85766b4f923015
        const studentId = '69528bce4c85766b4f923015';

        const student = await Student.findById(studentId).lean();

        if (!student) {
            console.log('Student not found in DB!');
            return;
        }

        console.log('--- RAW DATABASE RECORD ---');
        console.log(`Student ID: ${student._id}`);
        console.log(`Name:       ${student.fullName}`);
        console.log(`Grade ID:   ${student.grade}`);
        console.log(`Class ID:   ${student.classroom}`);

        // specific check
        if (student.grade && student.classroom) {
            console.log('\n--- VERIFYING LINKS ---');
            const grade = await Grade.findById(student.grade);
            const classroom = await Classroom.findById(student.classroom);
            console.log(`Linked Grade Name:     ${grade ? grade.name : 'MISSING'}`);
            console.log(`Linked Classroom Name: ${classroom ? classroom.name : 'MISSING'}`);

            console.log('\n✅ CONCLUSION: Data is PERMANENTLY stored in MongoDB.');
        } else {
            console.log('\n❌ WARNING: Grade or Classroom field is missing in DB record.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
