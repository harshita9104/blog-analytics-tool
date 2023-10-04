const express = require("express");
const axios = require("axios");
const _ = require("lodash");
const app = express();
const port = process.env.PORT || 3630;

app.use(express.json());

// Middleware to retrieve and analyze blog data
app.use(async (req, res, next) => {
  try {
    const response = await axios.get(
      "https://intent-kit-16.hasura.app/api/rest/blogs",
      {
        headers: {
          "x-hasura-admin-secret":
            "32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6",
        },
      }
    );

    const blogData = response.data;

    if (blogData.length === 0) {
      return res.status(404).json({ error: "No blogs were fetched." });
    }

    const totalBlogs = blogData.length;
    const longestTitleBlog = _.maxBy(blogData, "title.length");
    const blogsWithPrivacy = _.filter(blogData, (blog) =>
      _.includes(_.toLower(blog.title), "privacy")
    );
    const uniqueBlogTitles = _.uniq(_.map(blogData, "title"));

    req.analyzedData = {
      totalBlogs,
      longestTitle: longestTitleBlog ? longestTitleBlog.title : "N/A",
      blogsWithPrivacy: blogsWithPrivacy.length,
      uniqueBlogTitles,
    };

    next();
  } catch (error) {
    console.error("Error in middleware:", error); // Log the error
    res
      .status(500)
      .json({ error: "An error occurred while fetching and analyzing data." });
  }
});

// Endpoint to provide blog statistics
app.get("/api/blog-stats", (req, res) => {
  res.json(req.analyzedData);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error handling middleware:", err); // Log the error
  res.status(500).json({ error: "Internal server error." });
});

// Endpoint for blog search
app.get("/api/blog-search", (req, res) => {
  try {
    const query = req.query.query.toLowerCase();

    const searchResults = _.filter(req.analyzedData.uniqueBlogTitles, (title) =>
      _.includes(_.toLower(title), query)
    );

    res.json(searchResults);
  } catch (error) {
    console.error("Error in blog-search endpoint:", error); // Log the error
    res.status(500).json({ error: "An error occurred while searching." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
