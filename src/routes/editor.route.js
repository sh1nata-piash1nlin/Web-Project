const express = require('express');
const router = express.Router();
const editorService = require('../services/editor.service');
const dayjs = require('dayjs');

const ensureAuthenticated = (req, res, next) => {
  if (!req.session.isAuthenticated) {
    return res.redirect('/login');
  }
  next();
};

router.get('/editor', ensureAuthenticated, async (req, res) => {
  try {
    const articles = await editorService.getDraftArticles();
    res.render('main-editor', {
      articles,
      isAuthenticated: req.session.isAuthenticated, // Pass auth status
      authUser: req.session.authUser,              // Pass user info (avatar, role, etc.)
      layout: 'editor-layout', 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching draft articles.');
  }
});

router.get('/editor/accepted', async (req, res) => {
  const articleId = req.query.id;
  try {
    await editorService.acceptArticle(articleId);
    res.redirect('/editor');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error accepting article.');
  }
});

router.get('/editor/rejected',  ensureAuthenticated, async (req, res) => {
  const articleId = req.query.id;
  try {
    res.render('rejection-form.hbs', {
      layout: 'login-layout', // Use the appropriate layout
      articleId,
      isAuthenticated: req.session.isAuthenticated, // Pass auth status
      authUser: req.session.authUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading rejection form.');
  }
});

//form 
router.post('/editor/rejected',  async (req, res) => {
  const { article_id, rejection_reason } = req.body;

  try {
    // Call the service to reject the article
    await editorService.rejectArticle(article_id, rejection_reason);

    // Redirect back to the editor dashboard
    res.redirect('/editor');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error rejecting article.');
  }
});


router.get('/profile-editor', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.session.authUser; // Assuming the user object is in session
    res.render('profile-editor', {
      user: user, // Pass the user object, including the role
      isAuthenticated: req.session.isAuthenticated,
      authUser: req.session.authUser,
      layout: 'login-layout',
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching profile data.');
  }
});


router.get('/editor/edit-article', ensureAuthenticated, async (req, res) => {
  const articleId = req.query.id;

  try {
    const article = await editorService.getArticleById(articleId);
    const categories = await editorService.getAllCategories(); // Fetch all categories
    const tags = await editorService.getAllTags(); // Fetch all tags if needed

    res.render('edit-article', { 
      article, 
      categories, 
      tags, 
      layout:'editor-layout', 
      isAuthenticated: req.session.isAuthenticated, 
      authUser: req.session.authUser, });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading edit article page.');
  }
});

router.post('/editor/edit-article', async (req, res) => {
  const { id, category_id, tags, updated_at } = req.body;

  try {
    await editorService.updateArticle({
      id,
      category_id,
      tags: JSON.parse(tags), 
      updated_at,
    });

    res.redirect('/editor');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating the article.');
  }
});

router.get('/editor/article', ensureAuthenticated, async (req, res) => {
  const articleId = req.query.id;  // Get the article ID from query params

  try {
    const article = await editorService.getArticleById2(articleId);
    const categories = await editorService.getAllCategories(); // Fetch all categories
    const tags = await editorService.getAllTags(); // Fetch all tags
    const author = article.author_name;
    const category = categories.find(cat => cat.id === article.category_id);
    const tagList = tags.filter(tag => article.tags.includes(tag.id));

    res.render('article-editor', {
      article,
      category,
      tags: tagList,
      author,
      layout: 'editor-layout',
      isAuthenticated: req.session.isAuthenticated,
      authUser: req.session.authUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching article details.');
  }
});

router.get('/editor/editorPOV', ensureAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    
    // Get featured articles with pagination
    const { articles: featuredArticles, pagination } = await editorService.getFeaturedArticles(page);
    
    // Get other article types
    const mostViewedArticles = await editorService.getMostViewedArticles();
    const latestArticles = await editorService.getLatestArticles();
    const categories = await editorService.getCategories();

    res.render('main-editorPOV', {
      featuredArticles,
      pagination, // Add pagination to the template data
      mostViewedArticles,
      latestArticles,
      categories,
      isAuthenticated: req.session.isAuthenticated,
      authUser: req.session.authUser,
      layout: 'editor-layout'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching articles.');
  }
});


module.exports = router;
