package org.example.demo;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.demo.database.DatabaseConnection;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;

@WebServlet(name = "PostCommentServlet", value = "/post-comment-servlet")
public class PostCommentServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String commentText = request.getParameter("comment");
        String articleId = request.getParameter("articleId");

        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement("INSERT INTO comments (post_id, comment) VALUES (?, ?)")) {
            statement.setInt(1, Integer.parseInt(articleId));
            statement.setString(2, commentText);
            statement.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
        }

        response.sendRedirect("viewArticle.jsp?articleId=" + articleId);
    }
}