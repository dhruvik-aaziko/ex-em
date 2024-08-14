// import logger from "../logger";
// import cron from "node-cron";
// import { forgetPhotosUpload } from "./forgetPhotosUpload";

// export async function cronJob() {
//     try {
//         logger.info("===:: cronJob Start :: ===")
//         cron.schedule("30 17 * * *", async () => {
//             logger.info("Running forgetPhotosUpload Job...");
//             await forgetPhotosUpload()
//           });
        
//     } catch (error) {
//         logger.error(`There was an issue into cronJob.: ${error}`);
//         return 
//     }
//     return  
// }