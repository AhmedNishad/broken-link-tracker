import fsPromises from 'fs/promises'
import path from 'path'
// if you prefer commonJS, use this:
// require fsPromises from 'fs/promises'
// require path from 'path';

const emptyFolder = async (folderPath: string) => {
    try {
        // Find all files in the folder
        const files = await fsPromises.readdir(folderPath);
        for (const file of files) {
            await fsPromises.unlink(path.resolve(folderPath, file));
            console.log(`${folderPath}/${file} has been removed successfully`);
        }
    } catch (err){
        console.log(err);
    }
}



module.exports = emptyFolder;

export {}