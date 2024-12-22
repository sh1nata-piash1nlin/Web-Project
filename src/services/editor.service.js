const db = require('../utils/db.js');
const dayjs = require('dayjs');
const mysql = require('mysql2/promise');
const config = require('../config/config');

const pool = mysql.createPool({
  host: 'localhost',       // Tên host của database (thường là 'localhost')
  user: 'root',            // Tên người dùng MySQL
  password: '', // Mật khẩu của bạn
  database: 'sql_webnews_db',  // Tên database
  waitForConnections: true, // Chờ nếu không có kết nối nào có sẵn
  connectionLimit: 10,      // Số kết nối tối đa trong pool
  queueLimit: 0             // Không giới hạn số lượng query trong hàng đợi
});


  // Get all draft articles
  exports.getDraftArticles = async () => {
    const [articles] = await pool.execute(`
        SELECT 
            a.id,
            a.title,
            a.featured_image,
            a.created_at,
            a.status,
            a.is_premium,
            c.name AS category_name,
            u.full_name AS author_name
        FROM Articles a
        LEFT JOIN Categories c ON a.category_id = c.id
        LEFT JOIN Users u ON a.author_id = u.id
        WHERE a.status = 'draft'
        ORDER BY a.created_at ASC
    `);
    return articles;
  };

  // Fetch article details by ID for editing
  exports.getArticleById = async (articleId) => {
    const article = await db('Articles')
      .select(
        'Articles.id',
        'Articles.title',
        'Articles.category_id',
        'Articles.updated_at',
        db.raw('GROUP_CONCAT(Tags.id) AS tags') // Use GROUP_CONCAT for SQLite
      )
      .leftJoin('article_tags', 'Articles.id', 'article_tags.article_id') // Assuming a pivot table
      .leftJoin('Tags', 'article_tags.tag_id', 'Tags.id')
      .where('Articles.id', articleId)
      .groupBy('Articles.id')
      .first();
  
    // Normalize tags to always be an array
    const tags = article.tags 
      ? article.tags.split(',').map(tag => parseInt(tag, 10)) // Split the string and convert to integers
      : []; // Default to empty array if tags are null or undefined
  
    // Return the normalized article object
    return { ...article, tags };
  };
  
  exports.getArticleById2 = async (articleId) => {
    const article = await db('Articles')
  .select(
    'Articles.id',
    'Articles.title',
    'Articles.category_id',
    'Articles.updated_at',
    'Articles.content',
    'Articles.featured_image',
    'Articles.publish_date',
    db.raw('GROUP_CONCAT(Tags.id) AS tags')
  )
  .leftJoin('article_tags', 'Articles.id', 'article_tags.article_id')
  .leftJoin('Tags', 'article_tags.tag_id', 'Tags.id')
  .where('Articles.id', articleId)
  .groupBy('Articles.id')
  .first();

  // Normalize tags to always be an array
  const tags = article.tags 
    ? article.tags.split(',').map(tag => parseInt(tag, 10)) // Split and convert to numbers
    : []; // Default to empty array if no tags exist

  return { ...article, tags };
  };

  // Accept an article and set it as "published"
  exports.acceptArticle = async (articleId) => {
    return await db('Articles')
      .where('id', articleId)
      .update({
        status: 'published',
        publish_date: db.fn.now(), // Set current timestamp
      });
  };
  
  // Reject an article and add rejection reason
  exports.rejectArticle = async (articleId, rejectionReason) => {
    try {
      // Update the articles table to set status as 'rejected' and store the rejection reason in the abstract
      await db('Articles')
        .where('id', articleId)
        .update({
          status: 'rejected',
          abstract: rejectionReason, // Storing the rejection reason in the abstract column
        });
  
      // Insert into the drafts table with rejection reason and date
      await db('Drafts').insert({
        articles_id: articleId,
        reject_reason: rejectionReason,
        date: db.fn.now(), // Use the database's current timestamp
      });
  
    } catch (err) {
      console.error('Error rejecting article:', err);
      throw err;
    }
  };
  
  // Update article with new details
  exports.updateArticle = async (data) => {
    try {
      const { id, category_id, tags, updated_at } = data;

      await db.transaction(async (trx) => {
        // Update article basic info
        await trx('Articles')
          .where('id', id)
          .update({
            category_id,
            updated_at,
            status: 'published',
          });

        // Handle multiple tags
        if (Array.isArray(tags) && tags.length > 0) {
          // Create array of tag entries
          const tagEntries = tags.map(tagId => ({
            article_id: id,
            tag_id: parseInt(tagId)
          }));

          // Insert each tag entry separately
          for (const tagEntry of tagEntries) {
            await trx('article_tags').insert(tagEntry);
          }
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating article:', error);
      return { success: false, error: error.message };
    }
  };
  // Get article details for the rejection form
  exports.getArticleById = async (articleId) => {
    return await db('Articles')
      .select(
        'Articles.id',
        'Articles.title',
        'Users.full_name AS author_name',
        'Categories.name AS category_name'
      )
      .join('Users', 'Articles.author_id', 'Users.id')
      .join('Categories', 'Articles.category_id', 'Categories.id')
      .where('Articles.id', articleId)
      .first();
  };

  // Fetch all categories
exports.getAllCategories = async () => {
  return await db('Categories').select('id', 'name');
};

// Fetch all tags
exports.getAllTags = async () => {
  return await db('Tags').select('id', 'name');
};

// Add this new method
exports.getAllArticles = async () => {
  const articles = await db('Articles')
    .select(
      'Articles.id',
      'Articles.title',
      'Articles.status',
      'Articles.created_at',
      'Articles.featured_image',
      'Users.full_name AS author_name',
      'Categories.name AS category_name'
    )
    .join('Users', 'Articles.author_id', 'Users.id')
    .join('Categories', 'Articles.category_id', 'Categories.id')
    .orderBy('Articles.created_at', 'asc');

  return articles.map(article => ({
    ...article,
    created_at: dayjs(article.created_at).format('DD/MM/YYYY'),
    featured_image: article.featured_image || '/static/img/default.png',
  }));
};

exports.getFeaturedArticles = async (page = 1) => {
  try {
    const limit = 5;
    const offset = (page - 1) * limit;

    // Use pool.execute instead of db.execute
    const [articles] = await pool.execute(`
      SELECT 
        a.id,
        a.title,
        a.abstract,
        a.featured_image,
        a.is_premium,
        a.featured,
        DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date,
        c.name AS category_name,
        u.full_name AS author_name,
        COUNT(cm.id) as comments
      FROM Articles a
      LEFT JOIN Categories c ON a.category_id = c.id
      LEFT JOIN Users u ON a.author_id = u.id
      LEFT JOIN Comments cm ON a.id = cm.article_id
      WHERE a.featured = 1 
      AND a.status = 'published'
      GROUP BY a.id
      ORDER BY a.publish_date DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Get total count for pagination
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM Articles 
      WHERE featured = 1 
      AND status = 'published'
    `);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Create pagination object
    const pagination = {
      pages: [],
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
      prevPage: page - 1,
      nextPage: page + 1,
      currentPage: page,
      totalPages: totalPages
    };

    // Generate page numbers
    for (let i = 1; i <= totalPages; i++) {
      pagination.pages.push({
        pageNumber: i,
        isCurrentPage: i === page
      });
    }

    return {
      articles,
      pagination
    };
  } catch (error) {
    console.error('Error in getFeaturedArticles:', error);
    throw error;
  }
};

exports.getSidebarFeaturedArticles = async () => {
  return await db('Articles')
    .select(
      'Articles.*',
      'Users.full_name AS author_name',
      'Categories.name AS category_name'
    )
    .join('Users', 'Articles.author_id', 'Users.id')
    .join('Categories', 'Articles.category_id', 'Categories.id')
    .where('Articles.status', 'published')
    .orderBy('Articles.view_count', 'desc')
    .limit(5);
};

exports.getHealthArticles = async () => {
  const healthCategoryId = 8; 
  return await db('Articles')
    .select(
      'Articles.*',
      'Users.full_name AS author_name'
    )
    .join('Users', 'Articles.author_id', 'Users.id')
    .where({
      'Articles.status': 'published',
      'Articles.category_id': healthCategoryId
    })
    .orderBy('Articles.publish_date', 'desc')
    .limit(4);
};

exports.getLifeArticles = async () => {
  const lifeCategoryId = 9; // Make sure this matches your database
  return await db('Articles')
    .select(
      'Articles.*',
      'Users.full_name AS author_name'
    )
    .join('Users', 'Articles.author_id', 'Users.id')
    .where({
      'Articles.status': 'published',
      'Articles.category_id': lifeCategoryId
    })
    .orderBy('Articles.publish_date', 'desc')
    .limit(4);
};

exports.getTechArticles = async () => {
  const techCategoryId = 11; 
  return await db('Articles')
    .select(
      'Articles.*',
      'Users.full_name AS author_name'
    )
    .join('Users', 'Articles.author_id', 'Users.id')
    .where({
      'Articles.status': 'published',
      'Articles.category_id': techCategoryId
    })
    .orderBy('Articles.publish_date', 'desc')
    .limit(4);
};

exports.getCarArticles = async () => {
  const carCategoryId = 12;
  return await db('Articles')
    .select(
      'Articles.*',
      'Users.full_name AS author_name'
    )
    .join('Users', 'Articles.author_id', 'Users.id')
    .where({
      'Articles.status': 'published',
      'Articles.category_id': carCategoryId
    })
    .orderBy('Articles.publish_date', 'desc')
    .limit(4);
};

exports.getMostViewedArticles = async () => {
  return await db('Articles')
    .select(
      'Articles.*',
      'Users.full_name AS author_name',
      'Categories.name AS category_name'
    )
    .join('Users', 'Articles.author_id', 'Users.id')
    .join('Categories', 'Articles.category_id', 'Categories.id')
    .where('Articles.status', 'published')
    .orderBy('Articles.view_count', 'desc')
    .limit(5);
};

exports.getLatestArticles = async () => {
  return await db('Articles')
    .select(
      'Articles.*',
      'Users.full_name AS author_name',
      'Categories.name AS category_name'
    )
    .join('Users', 'Articles.author_id', 'Users.id')
    .join('Categories', 'Articles.category_id', 'Categories.id')
    .where('Articles.status', 'published')
    .orderBy('Articles.publish_date', 'desc')
    .limit(5);
};

// Add these methods based on article.controller.js
exports.getCategories = async () => {
    try {
        const categories = await db('Categories')
            .select('id', 'name', 'parent_id')
            .whereNull('parent_id');

        for (let category of categories) {
            const subcategories = await db('Categories')
                .select('id', 'name', 'parent_id')
                .where('parent_id', category.id);
            
            category.subcategories = subcategories;
        }

        return categories;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw new Error('Failed to retrieve categories');
    }
};
