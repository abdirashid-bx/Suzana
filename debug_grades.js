const mongoose = require('mongoose');
const Grade = require('./models/Grade');
const Student = require('./models/Student');
const Staff = require('./models/Staff');
const User = require('./models/User'); // Include in case needed

require('dotenv').config({ path: './.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const debugGrades = async () => {
    await connectDB();

    try {
        const grades = await Grade.find({});
        console.log(`\nFound ${grades.length} grades in DB:`);

        for (const grade of grades) {
            console.log(`\n-----------------------------------`);
            console.log(`Grade: ${grade.name} (ID: ${grade._id})`);
            console.log(`Teacher ID in Grade: ${grade.teacher || 'None'}`);

            if (grade.teacher) {
                const staff = await Staff.findById(grade.teacher);
                const user = await User.findById(grade.teacher);

                if (staff) console.log(` -> Matched STAFF: ${staff.fullName}`);
                else console.log(` -> NO matching Staff found`);

                if (user) console.log(` -> Matched USER: ${user.username}`);
                else console.log(` -> NO matching User found`);
            }

            const activeStudents = await Student.countDocuments({ grade: grade._id, status: 'active' });
            const allStudents = await Student.countDocuments({ grade: grade._id });
            console.log(`Students with this Grade ID: ${allStudents} (Active: ${activeStudents})`);

            // If 0, let's check one student to see what their grade looks like
            if (allStudents === 0) {
                const sampleStudent = await Student.findOne();
                if (sampleStudent) {
                    console.log(`Sample Student Grade ID: ${sampleStudent.grade}`);
                }
            }
        }
        console.log(`\n-----------------------------------`);

    } catch (error) {
        console.error('Debug Error:', error);
    } finally {
        mongoose.connection.close();
    }
};

debugGrades();
