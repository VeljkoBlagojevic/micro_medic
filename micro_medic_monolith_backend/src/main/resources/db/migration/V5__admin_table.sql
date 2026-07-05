CREATE TABLE IF NOT EXISTS admin (
    id         BIGINT PRIMARY KEY,
    CONSTRAINT fk_admin_user FOREIGN KEY (id) REFERENCES user(id)
) ENGINE=InnoDB;

INSERT INTO user (dtype, firstname, lastname, email, password)
VALUES ('Admin', 'Admin', 'Admin', 'admin@email.com', '$2a$12$1iZshSVbleYupORgfoPP8uvJdtDgNR8IuZa9u/7UXF8QGJQ/I4v2G');

INSERT INTO admin (id)
SELECT id FROM user WHERE dtype = 'Admin';