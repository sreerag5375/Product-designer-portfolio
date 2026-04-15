import dbConnect from '../lib/mongodb.js';
import Project from '../models/Project.js';

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const { fields, id, section, item } = req.query;

        // --- Single project fetch ---
        if (id) {
          let project = await Project.findById(id).catch(() => null);
          if (!project) project = await Project.findOne({ slug: id });
          if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

          const obj = project.toObject();

          // ?id=xxx&section=0&item=0  →  return ONE specific image (High performance $slice)
          if (section !== undefined && item !== undefined) {
            const sIdx = parseInt(section, 10);
            const iIdx = parseInt(item, 10);
            const projection = { designSections: { $slice: [sIdx, 1] } };
            
            // Optimization: Fetch only the required section using $slice
            let partialProject = await Project.findById(id).select(projection).lean().catch(() => null);
            if (!partialProject) {
              partialProject = await Project.findOne({ slug: id }).select(projection).lean();
            }

            if (!partialProject) return res.status(404).json({ success: false, error: 'Project not found' });
            
            // Due to $slice: [sIdx, 1], the requested section is always at index 0
            const sec = partialProject.designSections?.[0];
            const singleItem = sec?.items?.[iIdx];

            if (!singleItem) return res.status(404).json({ success: false, error: 'Item not found' });
            return res.status(200).json({ sectionIdx: sIdx, itemIdx: iIdx, item: singleItem });
          }

          // ?id=xxx&section=0  →  return section structure WITHOUT imageBase64
          if (section !== undefined) {
            const idx = parseInt(section, 10);
            const sec = obj.designSections?.[idx];
            if (!sec) return res.status(404).json({ success: false, error: 'Section not found' });
            
            // Return only titles and IDs for items in this section
            const itemsShell = (sec.items || []).map(it => ({ _id: it._id, title: it.title }));
            return res.status(200).json({ sectionIdx: idx, title: sec.title, items: itemsShell });
          }

          // ?id=xxx  →  return project metadata WITHOUT imageBase64 in items
          //              (just section titles + item titles — instant response)
          obj.designSections = (obj.designSections || []).map(sec => ({
            ...sec,
            items: (sec.items || []).map(item => ({ _id: item._id, title: item.title }))
          }));
          return res.status(200).json(obj);
        }

        // Lightweight list mode — text fields only, NO designSections images
        if (fields === 'list') {
          const projects = await Project.find({})
            .sort({ createdAt: -1 })
            .select('name slug type category subtitle description links logoBase64 createdAt');
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
