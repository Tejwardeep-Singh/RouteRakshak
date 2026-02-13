const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});


const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {

        let folderName = "cityrank/others";

        if (file.fieldname === "roadImage") {
            folderName = "cityrank/complaints/before";
        }

        if (file.fieldname === "afterImage") {
            folderName = "cityrank/complaints/after";
        }

        return {
            folder: folderName,
            allowed_formats: ["jpg", "jpeg", "png", "webp"]
        };
    }
});

module.exports = {
    cloudinary,
    storage
};
