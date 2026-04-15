import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../../../../../../../../.env') }); // Try to find .env

// Mock Project model since I can't import easily
const ProjectSchema = new mongoose.Schema({
  name: String,
  designSections: [{
    title: String,
    items: [{
      title: String,
      imageBase64: String,
    }]
  }],
  slug: String
});

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

async function test() {
  const uri = "mongodb+srv://sreerag5375:Sreerag5375@cluster0.pydf8.mongodb.net/portfolio?retryWrites=true&w=majority";
  await mongoose.connect(uri);
  console.log('Connected to DB');

  const id = '69da6eb7245a5f329806696d'; // From screenshot
  const sIdx = 0;
  const iIdx = 0;
  const projection = { [`designSections.${sIdx}.items.${iIdx}`]: 1 };

  console.log('--- Testing findById ---');
  let p = await Project.findById(id, projection).lean();
  console.log('Result:', JSON.stringify(p, null, 2));

  if (p && p.designSections) {
      console.log('Sections length:', p.designSections.length);
      console.log('Section 0:', p.designSections[0]);
  }

  console.log('--- Testing findOne by slug ---');
  let p2 = await Project.findOne({ slug: id }, projection).lean();
  console.log('Result:', JSON.stringify(p2, null, 2));

  await mongoose.disconnect();
}

test().catch(console.error);
