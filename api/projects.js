import dbConnect from '../lib/mongodb.js';
import Project from '../models/Project.js';

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const { fields, id } = req.query;

        // Fetch a single project by _id or slug (for project detail page)
        if (id) {
          let project = await Project.findById(id).catch(() => null);
          if (!project) {
            project = await Project.findOne({ slug: id });
          }
          if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
          }
          return res.status(200).json(project);
        }

        // Lightweight list mode — only return fields needed for folder grid
        if (fields === 'list') {
          const projects = await Project.find({})
            .sort({ createdAt: -1 })
            .select('name slug type category subtitle logoBase64 createdAt');
          return res.status(200).json(projects);
        }

        // Full list (admin, etc.)
        const projects = await Project.find({}).sort({ createdAt: -1 });

        // Auto-migrate: check for missing slugs
        const needsSlug = projects.filter(p => !p.slug);
        if (needsSlug.length > 0) {
          for (const p of needsSlug) {
            try {
              const doc = await Project.findById(p._id);
              if (doc && !doc.slug) {
                await doc.save();
              }
            } catch (err) {
              console.error(`Migration failed for ${p._id}:`, err);
            }
          }
          const finalProjects = await Project.find({}).sort({ createdAt: -1 });
          return res.status(200).json(finalProjects);
        }

        res.status(200).json(projects);
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;
    case 'POST':
      try {
        const project = await Project.create(req.body);
        res.status(201).json(project);
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;
    case 'PUT':
      try {
        const { id, ...data } = req.body;
        const updatedProject = await Project.findByIdAndUpdate(id, data, { new: true });
        if (!updatedProject) {
          return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.status(200).json(updatedProject);
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;
    case 'DELETE':
      try {
        const { id } = req.body;
        const deletedProject = await Project.findByIdAndDelete(id);
        if (!deletedProject) {
          return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.status(200).json({ success: true, data: deletedProject });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;
    default:
      res.status(400).json({ success: false });
      break;
  }
}
